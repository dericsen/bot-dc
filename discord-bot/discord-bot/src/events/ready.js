module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`✅ Bot online sebagai ${client.user.tag}`);
    client.user.setActivity('member baru | /rank', { type: 3 }); // type 3 = Watching
  },
};
