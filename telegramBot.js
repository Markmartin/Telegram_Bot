const TelegramBot = require('node-telegram-bot-api');
const token = '594630255:AAGLdnn4_wR4Vsbal6jBZrnFqnWgYk-gbGI';
// const token = '462566247:AAFHrPPnTn2miIbN_7O7rAYG06WQJK6yVVM';
const request = require('request');
const bot = new TelegramBot(token, { polling: true });

// const generateRegexp = /👍 Please PM @ITC_Bounty_Bot, reply “code” to gain a redeem code which values 5 points|👍 请私聊 @ITC_Bounty_Bot，回复”code”获取5个积分的兑换码|👍 @ITC_Bounty_Bot 과 1대1 대화창을 열고 ‘code’를 입력하면 5개 포인트에 해당하는 리딤 코드를 받아가실 수 있습니다/;
const generateRegexp = /👍 [\s\S]*/;
const queryRegexp = /code/i;

//广告清理
const advertisementRegexp = /[\s\S]*(拉人|微信|电报|软件|交易)[\s\S]*/;

//优秀发言
const adminIds = ['466038100', '460651927', '489158431', '419742358', '434341876']

//问答权限
const questionPermissionIds = ['466038100', '460651927']
const querstionGroupIds = ['-1001287571575', '-1001162269701'];
const questionStartRegexp = /Question (\d*)$/;
const questionEndRegexp = /Quiz ended for today/;
const answerRegexp = /^#(A|B|C|D)$/i;
const winnerRegexp = /Here are the winners/;


bot.onText(/\/echo ([0-9a-fA-F]{16})/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"
    // var telegramId = msg.from.first_name + ' ' + msg.from.last_name;
    var telegramId = msg.from.id;
    request.post({
            json: {
                privateCode: resp,
                telegramId: telegramId
            },
            url: 'http://localhost:3000/joinTelegram'
        }, function(error, response, body) {
            if (error) {
                bot.sendMessage(chatId, 'There has been an error, please enter the verification code again ', { reply_to_message_id: msg.message_id }).then(function(messageSent) {

                    setTimeout(function() {
                        bot.deleteMessage(chatId, messageSent.message_id).then(result => {
                            console.log('delete response result->' + result)
                        });
                    }, 1000 * 3);
                });
            } else {
                if (body.code == 200) {
                    bot.sendMessage(chatId, 'You have completed the tasks and received the following points. Thank you for your support ', { reply_to_message_id: msg.message_id }).then(function(messageSent) {

                        setTimeout(function() {
                            bot.deleteMessage(chatId, messageSent.message_id).then(result => {
                                console.log('delete response result->' + result)
                            });
                        }, 1000 * 3);
                    });
                } else {
                    bot.sendMessage(chatId, body.msg, { reply_to_message_id: msg.message_id }).then(function(messageSent) {

                        setTimeout(function() {
                            bot.deleteMessage(chatId, messageSent.message_id).then(result => {
                                console.log('delete response result->' + result)
                            });
                        }, 1000 * 3);
                    });
                }
            }

        })
        // send back the matched "whatever" to the chat
});

bot.onText(/\/echo (.+)/, (msg) => {
    let chatId = msg.chat.id;
    let messageId = msg.message_id;
    console.log('did receive listen msg->' + JSON.stringify(msg, null, 100));
    setTimeout(function() {
        bot.deleteMessage(chatId, messageId).then(result => {
            console.log('delete /echo msg result->' + result);
        });
    }, 1000 * 3);
});

bot.onText(generateRegexp, (msg, match) => {
    if (msg.chat.type == 'supergroup') {
        var isAdmin = adminIds.indexOf(msg.from.id.toString())
        if (isAdmin != -1) {
            if (msg.reply_to_message != undefined) {
                var chatId = msg.chat.id.toString();
                var groupName = msg.chat.title;
                var adminId = msg.from.id.toString();
                var telegramId = msg.reply_to_message.from.id.toString();
                /* nickName */
                var firstName = msg.reply_to_message.from.first_name == undefined ? '' : msg.reply_to_message.from.first_name;
                var lastName = msg.reply_to_message.from.last_name == undefined ? '' : msg.reply_to_message.from.last_name;
                var nickName = firstName + lastName;
                /* nickName */
                var msgId = msg.reply_to_message.message_id.toString();
                var msgText = msg.reply_to_message.text;
                request.post({
                    json: {
                        chatId: chatId,
                        groupName: groupName,
                        adminId: adminId,
                        telegramId: telegramId,
                        nickName: nickName,
                        msgId: msgId,
                        msgText: msgText
                    },
                    url: 'http://localhost:3000/generateRewardCode'
                }, function(error, response, body) {
                    if (error) {
                        console.log('生成奖励码失败')
                    } else {
                        if (body.code == 200) {
                            console.log('生成奖励码成功')
                        } else {
                            console.log(body.msg)
                        }
                    }
                })
            }
        }
    }
});

bot.onText(/\/price/ , (msg) => {
    let chatId = msg.chat.id;
    console.log('获取价格信息');
    var options = {
        url: 'https://api.iotchain.io/tokenPrice?symbol=itc',
    };
    function callback(error, response, body) {
        if (!error) {

            let  res = JSON.parse(body);
            let data = res.data;
            if (data){

                let message = 'USD Price: $'+data.usd+'\nBTC Price:'+data.btc+'\nETH Price: '+data.eth+'\n\n24h change ($):'+data.change+'%\n\nITC Rank:'+data.rank+'\nCirc Supply:'+data.supply;
                bot.sendMessage(chatId,message);
            }
        }
    }
    request(options, callback);
});

bot.onText(queryRegexp, (msg, match) => {
    if (msg.chat.type == 'private') {
        var chatId = msg.chat.id;
        var telegramId = msg.from.id.toString();
        request.post({
            json: {
                telegramId: telegramId
            },
            url: 'http://localhost:3000/queryRewardCode'
        }, function(error, response, body) {
            if (error) {
                bot.sendMessage(chatId, 'networking error', { reply_to_message_id: msg.message_id });
            } else {
                if (body.code == 200) {
                    var length = body.data.length;
                    var replyContent = 'You have ' + length + ' redeem codes: \n';
                    for (var i = 0; i < body.data.length; i++) {
                        replyContent = replyContent + '【' + body.data[i].rewardCode + '】' + '\n'
                    }
                    replyContent = replyContent + 'Please exchange this code in [the bounty system](https://bounty.iotchain.io/). [For more details, please click here](https://medium.com/iot-chain/are-you-a-key-contributor-to-the-itc-community-385c1fc767cb).'
                    bot.sendMessage(chatId, replyContent, { reply_to_message_id: msg.message_id, parse_mode: 'Markdown' });
                } else {
                    bot.sendMessage(chatId, body.msg, { reply_to_message_id: msg.message_id, parse_mode: 'Markdown' });
                }
            }
        })
    }
});

//开始第N个问题
bot.onText(questionStartRegexp, (msg, match) => {
    const chatId = msg.chat.id;
    if (msg.chat.type == 'supergroup') {
        if (querstionGroupIds.indexOf(msg.chat.id.toString()) != -1) {
            var isAdmin = questionPermissionIds.indexOf(msg.from.id.toString())
            if (isAdmin != -1) {
                //请求问题并且展示问题
                request.post({
                    json: {
                        questionId: match[1]
                    },
                    // url: 'http://127.0.0.1:3000/updateQuestion'
                    url: 'http://localhost:3000/updateQuestion'
                }, function(error, response, body) {
                    if (error) {
                        bot.sendMessage(chatId, 'networking error', { reply_to_message_id: msg.message_id });
                    } else {
                        if (body.code == 200) {
                            var questionContent = body.data;
                            var question = questionContent.questionContent +
                                '\n\nA. ' + questionContent.optionA +
                                '\n\nB. ' + questionContent.optionB +
                                '\n\nC. ' + questionContent.optionC +
                                '\n\nD. ' + questionContent.optionD;
                            bot.sendMessage(chatId, question, { reply_to_message_id: msg.message_id })
                        } else {
                            bot.sendMessage(chatId, body.msg, { reply_to_message_id: msg.message_id })
                        }
                    }
                })
            }
        }
    }
})

//结束问答
bot.onText(questionEndRegexp, (msg) => {
    const chatId = msg.chat.id;
    if (msg.chat.type == 'supergroup') {
        if (querstionGroupIds.indexOf(msg.chat.id.toString()) != -1) {
            var isAdmin = questionPermissionIds.indexOf(msg.from.id.toString())
            if (isAdmin != -1) {
                //结束今日问答
                request.post({
                    json: {

                    },
                    // url: 'http://127.0.0.1:3000/stopAnswer'
                    url: 'http://localhost:3000/stopAnswer'
                }, function(error, response, body) {
                    if (error) {
                        bot.sendMessage(chatId, 'close answer failed', { reply_to_message_id: msg.message_id })
                    } else {
                        if (body.code == 200) {
                            bot.sendMessage(chatId, 'close answer successfully', { reply_to_message_id: msg.message_id })
                        } else {
                            bot.sendMessage(chatId, 'close answer failed', { reply_to_message_id: msg.message_id })
                        }
                    }
                })
            }
        }
    }
})

//搜集答案
bot.onText(answerRegexp, (msg, match) => {
    if (msg.chat.type == 'supergroup') {
        if (querstionGroupIds.indexOf(msg.chat.id.toString()) != -1) {
            var firstName = msg.from.first_name == undefined ? '' : msg.from.first_name;
            var lastName = msg.from.last_name == undefined ? '' : msg.from.last_name;
            var answer = match[1].toUpperCase();
            var groupId = msg.chat.id.toString();
            var groupName = msg.chat.title;
            var telegramId = msg.from.id.toString();
            var telegramNickname = firstName + ' ' + lastName;
            request.post({
                json: {
                    answer: answer,
                    telegramId: telegramId,
                    telegramNickname: telegramNickname,
                    groupId: groupId,
                    groupName: groupName
                },
                // url: 'http://127.0.0.1:3000/answerQuestion'
                url: 'http://localhost:3000/answerQuestion'
            }, function(error, response, body) {

            })
        }
    }
})

//获奖名单
bot.onText(winnerRegexp, (msg) => {
    const chatId = msg.chat.id;
    if (msg.chat.type == 'supergroup') {
        var isAdmin = questionPermissionIds.indexOf(msg.from.id.toString())
        if (isAdmin != -1) {
            //结束今日问答
            request.post({
                json: {

                },
                // url: 'http://127.0.0.1:3000/winnerList'
                url: 'http://localhost:3000/winnerList'
            }, function(error, response, body) {
                if (error) {
                    bot.sendMessage(chatId, 'winnerList failed', { reply_to_message_id: msg.message_id })
                } else {
                    if (body.code == 200) {
                        var winnerList = body.data;
                        var replyMsg = '';
                        for (var i = 0; i < winnerList.length; i++) {
                            var user = winnerList[i];
                            replyMsg = replyMsg + '[@' + user.telegramNickname + '](tg://user?id=' + user.telegramId + ') —— ' + user.totalPoint + ' ITC\n';

                        }
                        bot.sendMessage(chatId, replyMsg, { parse_mode: 'Markdown' })
                    } else {
                        bot.sendMessage(chatId, 'winnerList failed', { reply_to_message_id: msg.message_id })
                    }
                }
            })
        }
    }
})

bot.on('message', (msg) => {
    let chatId = msg.chat.id;
    let message_id = msg.message_id;
    let new_chat_member = msg.new_chat_member;
    let new_chat_members = msg.new_chat_members;
    if (new_chat_member != null) {
        for (var i = 0; i < new_chat_members.length; i++) {

            var newMember = new_chat_members[i]; 
            var name = newMember.first_name + newMember.last_name;
            if (name.length > 20 || advertisementRegexp.test(name)) {
                bot.deleteMessage(chatId, message_id).then(result => {});
            }

            if (adminIds.indexOf(msg.from.id) === -1 && newMember.is_bot === true){
        
                bot.kickChatMember(chatId,newMember.id).then(result=>{
                    console.log('kick chat member result->'+result);
                });
            }
        }
        return;
    }

    let left_chat_member = msg.left_chat_member;
    if (left_chat_member != null) {
        if (left_chat_member.first_name.length > 20 || advertisementRegexp.test(left_chat_member.first_name + left_chat_member.last_name)) {
            bot.deleteMessage(chatId, message_id).then(result => {});
            return;
        }
    }
});

//