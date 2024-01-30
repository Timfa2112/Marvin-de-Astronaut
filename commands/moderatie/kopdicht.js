const Discord = require('discord.js');
const ms = require('ms');
const { adminID, stadthouderID, burgerijID, kopdichtID, strafkanaalID, logkanaalID, spanjoolID, alvaID, ridderID } = require('../../config.json');

module.exports = {
    name: "k",
    description: "Met kop dicht wordt nooit gemeemd.",
    usage: '[@tek] [getal][s/m/u/d] [reden]',
    admin : true,
    execute(message, args) {
        const catchErr = err => {console.log(err)}
        const logKanaal = message.client.channels.cache.get(logkanaalID);
        const strafKanaal = message.client.channels.cache.get(strafkanaalID);
        const kopdichtRol = message.guild.roles.cache.get(kopdichtID);
        let gebruikerRol;

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.channel.send('Ja nee sorry, ik kan dit lid niet vinden hoor. Misschien moet je beter typen?');
        }
        if (member === message.guild.me) {
            return message.channel.send('Het is niet de bedoeling dat je meemt met Kop Dicht, al helemaal niet door het aan mij te geven.');
        }
        if (member.roles.cache.has(adminID)) {
            gebruikerRol = message.guild.roles.cache.get(stadthouderID);
        }
        else {
            gebruikerRol = message.guild.roles.cache.get(burgerijID);
        }

        let time;
        let reden;
        if (!args[1]) {
            time = getRandomPunishment();
        }
        else {
            time = ms(args[1]);
            if (time > 1209600000) { // Maximum op 14 dagen want langer dan dat vindt de app niet leuk
                return message.channel.send('Zou top zijn als de ingevoerde tijd niet zo ontieglijk lang was (minder dan 14 dagen aub).');
            }
            else if (!time) {
                time = getRandomPunishment();
                reden = args.slice(1).join(' ');
            }
            else {
                reden = args.slice(2).join(' ');
            }
        }
        let duur = `**${ms(time, { long: true })}**`;

        if (!reden) {
            reden = 'Geen reden gegeven';
        }
        if (reden.length > 1024) {
            reden = reden.slice(0, 1021) + '...';
        }

        const otherPunishmentRoles = [alvaID, spanjoolID, ridderID];

        otherPunishmentRoles.forEach((roleID) => {
            if (member.roles.cache.has(roleID)) {
                let role = message.guild.roles.cache.get(roleID);
                try {
                    member.roles.remove(role);
                }
                catch (err) {
                    catchErr(err);
                }
            }
        })

        if (member.roles.cache.has(kopdichtID)) {
            return message.channel.send(`Wat de neuk heeft ${member.displayName} geflikt dat één Kop Dicht niet genoeg was, of heeft Paard weer schijt aan zijn strafrollen?`);
        }

        try {
            member.roles.add(kopdichtRol);
            member.roles.remove(gebruikerRol);
        }
        catch (err) {
            catchErr(err);
        }

        /*const muteEmbed = new Discord.MessageEmbed()
            .setTitle(`${member.displayName} heeft Kop Dicht voor **${duur}**.`)
            .addField('Reden', reden)
            .setFooter(message.member.displayName,  message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        strafKanaal.send(muteEmbed)
            .then(msg => {
                msg.delete({timeout: time}).catch(catchErr)
            })
            .catch(catchErr);*/

        message.react('👌');

        message.channel.send(`${voorzetsel()}, ${member.displayName} houdt nu zijn bakkes voor ${duur}`);

        setTimeout(() => {
            member.roles.add(gebruikerRol);
            member.roles.remove(kopdichtRol);
        }, time);
    }
}

function getRandomPunishment() {
    let ranMin = Math.random() * (210 - 30) + 30;
    return ms(`${ranMin}m`);
}

function voorzetsel() {
    var random = Math.floor((Math.random() * 11) + 1);
    switch (random) {
        case 1: return "Hatseflats";
        case 2: return "Hoppakee";
        case 3: return "Huts";
        case 4: return "Ayooo";
        case 5: return "Wajo";
        case 6: return "Wejo";
        case 7: return "Bam";
        case 8: return "Hoppa";
        case 9: return "Yoooo";
        case 10: return "Mwoah";
        case 11: return "Bwoah";
    }
}