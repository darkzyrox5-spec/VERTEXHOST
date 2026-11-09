
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

// ===============================
// VERTEXHOST CONFIGURATION
// ===============================

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

  if (welcome.image) {
    main.setImage(welcome.image);
  }

  if (welcome.thumbnail) {
    main.setThumbnail(welcome.thumbnail);
  }

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

// ===============================
// SLASH COMMANDS
// ===============================

const commands = [

  new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Manage your welcome system')

    .addSubcommand(s => s
      .setName('channel')
      .setDescription('Set welcome channel')
      .addChannelOption(o => o
        .setName('channel')
        .setDescription('Welcome channel')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)))

    .addSubcommand(s => s
      .setName('title')
      .setDescription('Edit welcome title')
      .addStringOption(o => o
        .setName('text')
        .setDescription('Title; supports {user}, {server}, {count}')
        .setRequired(true)))

    .addSubcommand(s => s
      .setName('description')
      .setDescription('Edit welcome description')
      .addStringOption(o => o
        .setName('text')
        .setDescription('Welcome message')
        .setRequired(true)))

    .addSubcommand(s => s
      .setName('color')
      .setDescription('Change embed color')
      .addStringOption(o => o
        .setName('hex')
        .setDescription('Example: #8B5CF6')
        .setRequired(true)))

    .addSubcommand(s => s
      .setName('image')
      .setDescription('Upload welcome image')
      .addAttachmentOption(o => o
        .setName('file')
        .setDescription('Upload image')
        .setRequired(true)))

    .addSubcommand(s => s
      .setName('thumbnail')
      .setDescription('Upload welcome thumbnail')
      .addAttachmentOption(o => o
        .setName('file')
        .setDescription('Upload image')
        .setRequired(true)))

    .addSubcommand(s => s
      .setName('footer')
      .setDescription('Edit embed footer')
      .addStringOption(o => o
        .setName('text')
        .setDescription('Footer text')
        .setRequired(true)))

    .addSubcommand(s => s
      .setName('addembed')
      .setDescription('Add another welcome embed')
      .addStringOption(o => o
        .setName('title')
        .setDescription('Embed title')
        .setRequired(true))
      .addStringOption(o => o
        .setName('description')
        .setDescription('Embed description')
        .setRequired(true)))

    .addSubcommand(s => s
      .setName('clearembeds')
      .setDescription('Remove additional embeds'))

    .addSubcommand(s => s
      .setName('preview')
      .setDescription('Preview welcome message'))

    .addSubcommand(s => s
      .setName('reset')
      .setDescription('Reset welcome design')),

  new SlashCommandBuilder()
    .setName('ownerrole')
    .setDescription('Set Owner role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(o => o
      .setName('role')
      .setDescription('Owner role')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('chairmanrole')
    .setDescription('Set Chairman role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(o => o
      .setName('role')
      .setDescription('Chairman role')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('ownerreply')
    .setDescription('Customize Owner auto reply')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o
      .setName('message')
      .setDescription('Owner reply')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('chairmanreply')
    .setDescription('Customize Chairman auto reply')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o
      .setName('message')
      .setDescription('Chairman reply')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('addresponse')
    .setDescription('Add custom auto response')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o
      .setName('trigger')
      .setDescription('Words that trigger the reply')
      .setRequired(true))
    .addStringOption(o => o
      .setName('reply')
      .setDescription('Automatic reply')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('removeresponse')
    .setDescription('Remove auto response')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o
      .setName('trigger')
      .setDescription('Trigger to remove')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('listresponses')
    .setDescription('Show all auto responses')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show VERTEXHOST commands')
];

// ===============================
// BOT READY
// ===============================

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

// ===============================
// WELCOME SYSTEM
// ===============================

client.on('guildMemberAdd', async member => {
  const config = getConfig(member.guild.id);
  const channelId = config.welcomeChannel;

  if (channelId) {
    const channel = await member.guild.channels
      .fetch(channelId).catch(() => null);

    if (channel?.isTextBased()) {
      await channel.send({
        content: `Welcome ${member}!`,
        embeds: buildEmbeds(member, config),
        allowedMentions: { users: [member.id] }
      }).catch(console.error);
    }
  }

  // Auto role
  if (config.autoRole) {
    const role = await member.guild.roles
      .fetch(config.autoRole).catch(() => null);

    if (role?.editable && !role.managed) {
      await member.roles.add(role).catch(console.error);
    }
  }
});

// ===============================
// GOODBYE SYSTEM
// ===============================

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
      `${member.user.username} has left ${member.guild.name}.`
    )
    .setTimestamp();

  channel.send({ embeds: [embed] }).catch(console.error);
});

// ===============================
// OWNER / CHAIRMAN AUTO REPLY
// ===============================

client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;

  const config = getConfig(message.guild.id);

  // Check mentioned users, not just role mentions
  for (const user of message.mentions.users.values()) {
    const member = await message.guild.members
      .fetch(user.id).catch(() => null);

    if (!member) continue;

    const isOwner = config.ownerRole &&
      member.roles.cache.has(config.ownerRole);

    const isChairman = config.chairmanRole &&
      member.roles.cache.has(config.chairmanRole);

    // Owner takes priority if a member has both roles
    if (isOwner) {
      await message.reply({
        content: config.ownerReply ||
          'Please wait for the Owner\'s response.',
        allowedMentions: { repliedUser: false }
      });
      return;
    }

    if (isChairman) {
      await message.reply({
        content: config.chairmanReply ||
          'Please wait for the Chairman\'s response.',
        allowedMentions: { repliedUser: false }
      });
      return;
    }
  }

  // Custom auto responses
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

// ===============================
// COMMAND HANDLER
// ===============================

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const id = interaction.guildId;
  if (!id) return;

  const config = getConfig(id);

  const adminCommands = [
    'welcome',
    'ownerrole',
    'chairmanrole',
    'ownerreply',
    'chairmanreply',
    'addresponse',
    'removeresponse',
    'listresponses'
  ];

  if (adminCommands.includes(interaction.commandName) &&
      !isAdmin(interaction)) {
    return interaction.reply({
      content: 'You need Manage Server permission.',
      ephemeral: true
    });
  }

  const name = interaction.commandName;

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
          content: 'Invalid color. Use a hex color like #8B5CF6.',
          ephemeral: true
        });
      }

      w.color = color;
    }

    if (sub === 'image' || sub === 'thumbnail') {
      const file = interaction.options.getAttachment('file');

      if (!file.contentType?.startsWith('image/')) {
        return interaction.reply({
          content: 'Please upload a valid image file.',
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
      content: `VERTEXHOST: Welcome ${sub} updated successfully!`,
      ephemeral: true
    });
  }

  if (name === 'ownerrole') {
    config.ownerRole =
      interaction.options.getRole('role').id;
    saveConfig(id, config);

    return interaction.reply({
      content: 'Owner role saved successfully!',
      ephemeral: true
    });
  }

  if (name === 'chairmanrole') {
    config.chairmanRole =
      interaction.options.getRole('role').id;
    saveConfig(id, config);

    return interaction.reply({
      content: 'Chairman role saved successfully!',
      ephemeral: true
    });
  }

  if (name === 'ownerreply') {
    config.ownerReply =
      interaction.options.getString('message');
    saveConfig(id, config);

    return interaction.reply({
      content: 'Owner auto reply updated!',
      ephemeral: true
    });
  }

  if (name === 'chairmanreply') {
    config.chairmanReply =
      interaction.options.getString('message');
    saveConfig(id, config);

    return interaction.reply({
      content: 'Chairman auto reply updated!',
      ephemeral: true
    });
  }

  if (name === 'addresponse') {
    const trigger = interaction.options.getString('trigger');
    const reply = interaction.options.getString('reply');

    config.responses = config.responses || [];

    const existing = config.responses.find(
      r => r.trigger.toLowerCase() === trigger.toLowerCase()
    );

    if (existing) {
      existing.reply = reply;
    } else {
      config.responses.push({ trigger, reply });
    }

    saveConfig(id, config);

    return interaction.reply({
      content: `Auto response saved for: ${trigger}`,
      ephemeral: true
    });
  }

  if (name === 'removeresponse') {
    const trigger = interaction.options.getString('trigger');

    config.responses = config.responses || [];

    const before = config.responses.length;

    config.responses = config.responses.filter(
      r => r.trigger.toLowerCase() !== trigger.toLowerCase()
    );

    saveConfig(id, config);

    return interaction.reply({
      content: before === config.responses.length
        ? 'Trigger not found.'
        : 'Auto response removed.',
      ephemeral: true
    });
  }

  if (name === 'listresponses') {
    const responses = config.responses || [];

    return interaction.reply({
      content: responses.length
        ? responses.map(r =>
            `**${r.trigger}** → ${r.reply}`
          ).join('\n').slice(0, 1900)
        : 'No custom responses configured.',
      ephemeral: true
    });
  }

  if (name === 'help') {
    return interaction.reply({
      content:
        '**VERTEXHOST COMMANDS**\n' +
        '`/welcome` - Manage welcome embeds\n' +
        '`/ownerrole` - Set Owner role\n' +
        '`/chairmanrole` - Set Chairman role\n' +
        '`/ownerreply` - Edit Owner reply\n' +
        '`/chairmanreply` - Edit Chairman reply\n' +
        '`/addresponse` - Add auto response\n' +
        '`/removeresponse` - Remove response\n' +
        '`/listresponses` - List responses',
      ephemeral: true
    });
  }
});

// ===============================
// ERROR HANDLING
// ===============================

client.on('error', console.error);

process.on('unhandledRejection', error => {
  console.error('VERTEXHOST error:', error);
});

// ===============================
// LOGIN
// ===============================

if (!process.env.DISCORD_TOKEN) {
  throw new Error('DISCORD_TOKEN is missing!');
}

client.login(process.env.DISCORD_TOKEN);
