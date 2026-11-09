
require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DATA = path.join(__dirname, 'data');

if (!fs.existsSync(DATA)) {
  fs.mkdirSync(DATA, { recursive: true });
}

function getConfig(id) {
  const file = path.join(DATA, `${id}.json`);
  if (!fs.existsSync(file)) return {};

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

function saveConfig(id, config) {
  fs.writeFileSync(
    path.join(DATA, `${id}.json`),
    JSON.stringify(config, null, 2)
  );
}

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(
    PermissionFlagsBits.ManageGuild
  );
}

function replaceText(text, member) {
  return (text || '')
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{count}', String(member.guild.memberCount));
}

function buildEmbeds(member, config) {
  const welcome = config.welcome || {};

  const main = new EmbedBuilder()
    .setColor(welcome.color || '#8B5CF6')
    .setTitle(replaceText(
      welcome.title || 'Welcome to {server}!',
      member
    ))
    .setDescription(replaceText(
      welcome.description ||
      'Hello {user}! Welcome to our community.',
      member
    ))
    .setTimestamp();

  if (welcome.footer) {
    main.setFooter({
      text: replaceText(welcome.footer, member)
    });
  }

  if (welcome.image) main.setImage(welcome.image);
  if (welcome.thumbnail) main.setThumbnail(welcome.thumbnail);

  const extra = (welcome.extra || []).map(item => {
    const embed = new EmbedBuilder()
      .setColor(item.color || '#8B5CF6')
      .setTitle(replaceText(item.title, member))
      .setDescription(replaceText(item.description, member));

    if (item.image) embed.setImage(item.image);
    return embed;
  });

  return [main, ...extra].slice(0, 10);
}

const commands = [
  new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Manage your welcome system')
    .addSubcommand(s => s.setName('channel')
      .setDescription('Set welcome channel')
      .addChannelOption(o => o.setName('channel')
        .setDescription('Welcome channel')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)))
    .addSubcommand(s => s.setName('title')
      .setDescription('Edit welcome title')
      .addStringOption(o => o.setName('text')
        .setDescription('Welcome title')
        .setRequired(true)))
    .addSubcommand(s => s.setName('description')
      .setDescription('Edit welcome description')
      .addStringOption(o => o.setName('text')
        .setDescription('Welcome message')
        .setRequired(true)))
    .addSubcommand(s => s.setName('color')
      .setDescription('Change embed color')
      .addStringOption(o => o.setName('hex')
        .setDescription('Example: #8B5CF6')
        .setRequired(true)))
    .addSubcommand(s => s.setName('image')
      .setDescription('Upload welcome image')
      .addAttachmentOption(o => o.setName('file')
        .setDescription('Upload image')
        .setRequired(true)))
    .addSubcommand(s => s.setName('thumbnail')
      .setDescription('Upload welcome thumbnail')
      .addAttachmentOption(o => o.setName('file')
        .setDescription('Upload image')
        .setRequired(true)))
    .addSubcommand(s => s.setName('footer')
      .setDescription('Edit embed footer')
      .addStringOption(o => o.setName('text')
        .setDescription('Footer text')
        .setRequired(true)))
    .addSubcommand(s => s.setName('addembed')
      .setDescription('Add another welcome embed')
      .addStringOption(o => o.setName('title')
        .setDescription('Embed title')
        .setRequired(true))
      .addStringOption(o => o.setName('description')
        .setDescription('Embed description')
        .setRequired(true)))
    .addSubcommand(s => s.setName('clearembeds')
      .setDescription('Remove additional embeds'))
    .addSubcommand(s => s.setName('preview')
      .setDescription('Preview welcome message'))
    .addSubcommand(s => s.setName('reset')
      .setDescription('Reset welcome design')),

  new SlashCommandBuilder()
    .setName('goodbye')
    .setDescription('Manage your goodbye system')
    .addSubcommand(s => s.setName('channel')
      .setDescription('Set goodbye channel')
      .addChannelOption(o => o.setName('channel')
        .setDescription('Goodbye channel')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)))
    .addSubcommand(s => s.setName('message')
      .setDescription('Set goodbye message')
      .addStringOption(o => o.setName('text')
        .setDescription('Goodbye message')
        .setRequired(true)))
    .addSubcommand(s => s.setName('reset')
      .setDescription('Reset goodbye settings')),

  new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Manage automatic role')
    .addSubcommand(s => s.setName('set')
      .setDescription('Set automatic role')
      .addRoleOption(o => o.setName('role')
        .setDescription('Role to assign')
        .setRequired(true)))
    .addSubcommand(s => s.setName('remove')
      .setDescription('Disable automatic role')),

  new SlashCommandBuilder()
    .setName('ownerrole')
    .setDescription('Set Owner role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(o => o.setName('role')
      .setDescription('Owner role')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('chairmanrole')
    .setDescription('Set Chairman role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(o => o.setName('role')
      .setDescription('Chairman role')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('ownerreply')
    .setDescription('Customize Owner auto reply')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('message')
      .setDescription('Owner reply')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('chairmanreply')
    .setDescription('Customize Chairman auto reply')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('message')
      .setDescription('Chairman reply')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('addresponse')
    .setDescription('Add or update auto response')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('trigger')
      .setDescription('Trigger words')
      .setRequired(true))
    .addStringOption(o => o.setName('reply')
      .setDescription('Automatic reply')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('removeresponse')
    .setDescription('Remove auto response')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('trigger')
      .setDescription('Trigger to remove')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('listresponses')
    .setDescription('List auto responses')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show VERTEXHOST commands')
];

client.once('ready', async () => {
  console.log('============================');
  console.log('VERTEXHOST IS ONLINE!');
  console.log(`Logged in as ${client.user.tag}`);
  console.log('============================');

  const rest = new REST({ version: '10' })
    .setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands.map(c => c.toJSON()) }
    );

    console.log('VERTEXHOST commands registered!');
  } catch (error) {
    console.error('Command error:', error);
  }

  client.user.setActivity('VERTEXHOST | Welcoming members');
});

// WELCOME SYSTEM
client.on('guildMemberAdd', async member => {
  const config = getConfig(member.guild.id);

  if (config.welcomeChannel) {
    const channel = await member.guild.channels
      .fetch(config.welcomeChannel).catch(() => null);

    if (channel?.isTextBased()) {
      await channel.send({
        content: `Welcome ${member}!`,
        embeds: buildEmbeds(member, config),
        allowedMentions: { users: [member.id] }
      }).catch(console.error);
    }
  }

  // AUTO ROLE
  if (config.autoRole) {
    const role = await member.guild.roles
      .fetch(config.autoRole).catch(() => null);

    if (role?.editable && !role.managed) {
      await member.roles.add(role).catch(console.error);
    }
  }
});

// GOODBYE SYSTEM
client.on('guildMemberRemove', async member => {
  const config = getConfig(member.guild.id);

  if (!config.goodbyeChannel) return;

  const channel = await member.guild.channels
    .fetch(config.goodbyeChannel).catch(() => null);

  if (!channel?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor('#EF4444')
    .setTitle('Goodbye!')
    .setDescription(
      replaceText(
        config.goodbyeMessage ||
          '{username} has left {server}.',
        member
      )
    )
    .setTimestamp();

  channel.send({ embeds: [embed] }).catch(console.error);
});

// OWNER / CHAIRMAN AUTO REPLY
client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;

  const config = getConfig(message.guild.id);

  for (const user of message.mentions.users.values()) {
    const member = await message.guild.members
      .fetch(user.id).catch(() => null);

    if (!member) continue;

    const isOwner = config.ownerRole &&
      member.roles.cache.has(config.ownerRole);

    const isChairman = config.chairmanRole &&
      member.roles.cache.has(config.chairmanRole);

    if (isOwner) {
      await message.reply({
        content: config.ownerReply ||
          "Please wait for the Owner's response.",
        allowedMentions: { repliedUser: false }
      });
      return;
    }

    if (isChairman) {
      await message.reply({
        content: config.chairmanReply ||
          "Please wait for the Chairman's response.",
        allowedMentions: { repliedUser: false }
      });
      return;
    }
  }

  // CUSTOM AUTO RESPONSES
  const responses = config.responses || [];
  const content = message.content.toLowerCase();

  const match = responses.find(item =>
    content.includes(item.trigger.toLowerCase())
  );

  if (match) {
    await message.reply({
      content: match.reply,
      allowedMentions: { repliedUser: false }
    });
  }
});

// COMMAND HANDLER
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const id = interaction.guildId;
  if (!id) return;

  const config = getConfig(id);

  const adminCommands = [
    'welcome',
    'goodbye',
    'autorole',
    'ownerrole',
    'chairmanrole',
    'ownerreply',
    'chairmanreply',
    'addresponse',
    'removeresponse',
    'listresponses'
  ];

  if (
    adminCommands.includes(interaction.commandName) &&
    !isAdmin(interaction)
  ) {
    return interaction.reply({
      content: 'You need Manage Server permission.',
      ephemeral: true
    });
  }

  const name = interaction.commandName;

  // WELCOME COMMANDS
  if (name === 'welcome') {
    const sub = interaction.options.getSubcommand();

    config.welcome = config.welcome || {};
    const w = config.welcome;

    if (sub === 'channel') {
      config.welcomeChannel =
        interaction.options.getChannel('channel').id;
    }

    if (sub === 'title') {
      w.title = interaction.options.getString('text');
    }

    if (sub === 'description') {
      w.description = interaction.options.getString('text');
    }

    if (sub === 'color') {
      const color = interaction.options.getString('hex');

      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return interaction.reply({
          content: 'Invalid color. Use #8B5CF6 format.',
          ephemeral: true
        });
      }

      w.color = color;
    }

    if (sub === 'image' || sub === 'thumbnail') {
      const file = interaction.options.getAttachment('file');

      if (!file.contentType?.startsWith('image/')) {
        return interaction.reply({
          content: 'Please upload a valid image.',
          ephemeral: true
        });
      }

      w[sub] = file.url;
    }

    if (sub === 'footer') {
      w.footer = interaction.options.getString('text');
    }

    if (sub === 'addembed') {
      w.extra = w.extra || [];

      if (w.extra.length >= 9) {
        return interaction.reply({
          content: 'Maximum of 9 additional embeds reached.',
          ephemeral: true
        });
      }

      w.extra.push({
        title: interaction.options.getString('title'),
        description: interaction.options.getString('description'),
        color: w.color || '#8B5CF6'
      });
    }

    if (sub === 'clearembeds') {
      w.extra = [];
    }

    if (sub === 'reset') {
      config.welcome = {};
    }

    if (sub === 'preview') {
      return interaction.reply({
        content: 'VERTEXHOST welcome preview:',
        embeds: buildEmbeds(interaction.member, config),
        ephemeral: true
      });
    }

    saveConfig(id, config);

    return interaction.reply({
      content: `Welcome ${sub} updated successfully!`,
      ephemeral: true
    });
  }
});

// REMAINING COMMANDS
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const id = interaction.guildId;
  if (!id) return;

  const config = getConfig(id);
  const name = interaction.commandName;

  const adminCommands = [
    'goodbye',
    'autorole',
    'ownerrole',
    'chairmanrole',
    'ownerreply',
    'chairmanreply',
    'addresponse',
    'removeresponse',
    'listresponses'
  ];

  // Part 2 already sends the permission message.
  if (adminCommands.includes(name) && !isAdmin(interaction)) {
    return;
  }

  // GOODBYE COMMAND
  if (name === 'goodbye') {
    const sub = interaction.options.getSubcommand();

    if (sub === 'channel') {
      config.goodbyeChannel =
        interaction.options.getChannel('channel').id;
    }

    if (sub === 'message') {
      config.goodbyeMessage =
        interaction.options.getString('text');
    }

    if (sub === 'reset') {
      delete config.goodbyeChannel;
      delete config.goodbyeMessage;
    }

    saveConfig(id, config);

    return interaction.reply({
      content: `Goodbye ${sub} updated successfully!`,
      ephemeral: true
    });
  }

  // AUTO ROLE COMMAND
  if (name === 'autorole') {
    const sub = interaction.options.getSubcommand();

    if (sub === 'remove') {
      delete config.autoRole;
      saveConfig(id, config);

      return interaction.reply({
        content: 'Auto role has been disabled!',
        ephemeral: true
      });
    }

    if (sub === 'set') {
      const role = interaction.options.getRole('role');
      const botMember = await interaction.guild.members.fetchMe();

      if (
        role.managed ||
        role.id === interaction.guild.id ||
        role.position >= botMember.roles.highest.position
      ) {
        return interaction.reply({
          content: 'Move the VERTEXHOST bot role above the selected role, then try again.',
          ephemeral: true
        });
      }

      config.autoRole = role.id;
      saveConfig(id, config);

      return interaction.reply({
        content: `Auto role set to ${role.name}!`,
        ephemeral: true
      });
    }
  }

  // OWNER ROLE
  if (name === 'ownerrole') {
    config.ownerRole = interaction.options.getRole('role').id;
    saveConfig(id, config);

    return interaction.reply({
      content: 'Owner role updated successfully!',
      ephemeral: true
    });
  }

  // CHAIRMAN ROLE
  if (name === 'chairmanrole') {
    config.chairmanRole = interaction.options.getRole('role').id;
    saveConfig(id, config);

    return interaction.reply({
      content: 'Chairman role updated successfully!',
      ephemeral: true
    });
  }

  // OWNER AUTO REPLY
  if (name === 'ownerreply') {
    config.ownerReply = interaction.options.getString('message');
    saveConfig(id, config);

    return interaction.reply({
      content: 'Owner auto-reply updated!',
      ephemeral: true
    });
  }

  // CHAIRMAN AUTO REPLY
  if (name === 'chairmanreply') {
    config.chairmanReply = interaction.options.getString('message');
    saveConfig(id, config);

    return interaction.reply({
      content: 'Chairman auto-reply updated!',
      ephemeral: true
    });
  }

  // ADD CUSTOM RESPONSE
  if (name === 'addresponse') {
    const trigger = interaction.options.getString('trigger');
    const reply = interaction.options.getString('reply');

    config.responses = config.responses || [];

    const existing = config.responses.find(
      item => item.trigger.toLowerCase() === trigger.toLowerCase()
    );

    if (existing) {
      existing.reply = reply;
    } else {
      config.responses.push({ trigger, reply });
    }

    saveConfig(id, config);

    return interaction.reply({
      content: `Response saved for trigger: ${trigger}`,
      ephemeral: true
    });
  }

  // REMOVE CUSTOM RESPONSE
  if (name === 'removeresponse') {
    const trigger = interaction.options.getString('trigger');

    config.responses = config.responses || [];

    const oldLength = config.responses.length;

    config.responses = config.responses.filter(
      item => item.trigger.toLowerCase() !== trigger.toLowerCase()
    );

    if (oldLength === config.responses.length) {
      return interaction.reply({
        content: 'That trigger was not found.',
        ephemeral: true
      });
    }

    saveConfig(id, config);

    return interaction.reply({
      content: `Removed response: ${trigger}`,
      ephemeral: true
    });
  }

  // LIST CUSTOM RESPONSES
  if (name === 'listresponses') {
    const responses = config.responses || [];

    if (responses.length === 0) {
      return interaction.reply({
        content: 'No custom responses have been added yet.',
        ephemeral: true
      });
    }

    const output = responses.map(
      item => `**${item.trigger}** → ${item.reply}`
    ).join('\n');

    return interaction.reply({
      content: output.slice(0, 1900),
      ephemeral: true
    });
  }

  // HELP COMMAND
  if (name === 'help') {
    return interaction.reply({
      content: [
        '**VERTEXHOST COMMANDS**',
        '',
        '**Welcome System**',
        '`/welcome channel`',
        '`/welcome title`',
        '`/welcome description`',
        '`/welcome color`',
        '`/welcome image`',
        '`/welcome thumbnail`',
        '`/welcome footer`',
        '`/welcome addembed`',
        '`/welcome clearembeds`',
        '`/welcome preview`',
        '`/welcome reset`',
        '',
        '**Goodbye System**',
        '`/goodbye channel`',
        '`/goodbye message`',
        '`/goodbye reset`',
        '',
        '**Auto Role**',
        '`/autorole set`',
        '`/autorole remove`',
        '',
        '**Owner & Chairman**',
        '`/ownerrole`',
        '`/chairmanrole`',
        '`/ownerreply`',
        '`/chairmanreply`',
        '',
        '**Custom Responses**',
        '`/addresponse`',
        '`/removeresponse`',
        '`/listresponses`',
        '',
        '`/help`'
      ].join('\n'),
      ephemeral: true
    });
  }
});

// ERROR HANDLING
client.on('error', console.error);

process.on('unhandledRejection', error => {
  console.error('VERTEXHOST error:', error);
});

// BOT LOGIN
if (!process.env.DISCORD_TOKEN) {
  throw new Error('DISCORD_TOKEN is missing!');
}

client.login(process.env.DISCORD_TOKEN);
