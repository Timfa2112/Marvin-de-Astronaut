const { prefix, ownerID, adminID } = require("../config.json");
var valuePairs = {};
const common = require("../common.js");
const fs = require('node:fs');

module.exports = {
    name: 'messageCreate',
    async execute (interaction)
    {
        // Immediatly return if the message came from another bot
        if (interaction.author.bot) return;

        const fullContent = interaction.content.toLowerCase();
        const args = interaction.content.slice(prefix.length).trim().split(/ +/g);
        const commandName = args.shift().toLowerCase();
        const client = interaction.client;

        if (fullContent.includes("ruimte"))
        {
            interaction.react('🌌');
        }

        if (fullContent === "kutmarvin" || fullContent === "kuthaan")
        {
            return interaction.channel.send(`kut${interaction.member.displayName.toLowerCase()}`);
        }

        if (valuePairs['roulette'] && fullContent.includes(valuePairs['roulette']))
        {
            interaction.channel.send(`Woa-hoah! ${interaction.member.displayName} zei het roulettewoord! Tek de stadthouders om deze persoon te geven wat die verdiend.`);
        }

        await sakspolitie(interaction, message, fullContent, interaction.author);

        // Stopt als het geen prefix kon vinden
        if (!interaction.content.startsWith(prefix)) return;

        // Rookmelding? Netjes.
        if (!isNaN(commandName) && !args.length)
        {
            var rookBericht = rookMelding(commandName, interaction.author);
            return interaction.channel.send(rookBericht);
        }

        if (commandName === 'roulette' && interaction.member.roles.cache.has(adminID))
        {
            var rouletteWord = args[0];

            if (!rouletteWord)
            {
                valuePairs['roulette'] = null;
                return interaction.channel.send("Huidig roulette-woord verwijderd, geen nieuwe toegevoegd!");
            } else
            {
                valuePairs['roulette'] = rouletteWord;
                return interaction.channel.send(`Groot succes! Huidig roulette-woord is nu ${valuePairs['roulette']}`);
            }
        }

        // Command niet aanwezig na de prefix? Stop.
        if (!client.commands.has(commandName))
        {
            let brutaleOpmerking = geefBrutaalCommentaar();
            return interaction.channel.send(brutaleOpmerking);
        }

        // Haalt de command en duwt hem in een variabel
        const command = client.commands.get(commandName);

        // ipv naamvergelijking kan dit mogelijk ook naar keuren op role-id
        if (command.admin && !interaction.member.roles.cache.has(adminID) && interaction.member.id != ownerID)
        {
            return interaction.reply('Ho es ff, dat mag jij helemaal niet doen, mislukte poesblaffer');
        }

        // Commando's exclusief voor Haan (lol haha)
        if (command.exclusive && interaction.author.id !== ownerID)
        {
            return interaction.channel.send("Hoe durf je mij hierop aan te spreken, alleen mijn schepper en verwekker mag dat!!");
        }

        // Controleert of parameters gegeven moeten worden, indien van wel en ze zijn er niet dan geeft Marvin een melding
        if (command.args && !args.length)
        {
            let reply = `Hee klaplul, je moet wel goed specificeren wat je wilt, hé?!`;

            if (command.usage)
            {
                reply += `\nZo hoor je het commando gebruiken: \`${prefix}${command.name} ${command.usage}\``;
            }
            return interaction.channel.send(reply);
        }

        // Eindelijk voeren we de content van de command uit
        try
        {
            command.execute(interaction, args);
        } catch (err)
        {
            console.log(err);
            interaction.channel.send('oepsiedoepsie, er ging iets stukkiewukkie!');
        }
    },
};

async function sakspolitie (interaction, message, fullMessage, gebruiker)
{
    const saksData = require('./saksData.json');
    let kanalen = [];

    try
    {
        kanalen = JSON.parse(fs.readFileSync('./autospanjoolkanalen.json', 'utf8'));
    } catch (err)
    {
        console.log('Kon autospanjoolkanalen.json niet lezen, dus ik maak een nieuwe');
        fs.writeFile("./autospanjoolkanalen.json", JSON.stringify([]), function (err)
        {
            if (err)
            {
                console.log(err);
            }

            console.log(`Auto-spanjool gegevens opgeslagen.`);
        });
    }

    if (!kanalen.includes(message.channel))
        return;

    const member = await interaction.guild.members.fetch(gebruiker.id);
    const joinedAt = member.joinedAt;
    const diffMs = Date.now() - joinedAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < saksData.urenTotWaarschuwingen)
        return;

    let woorden = findMatchedWords(fullMessage, saksData.saksWoorden);

    if (woorden.length === 0)
        return;

    let berichtWoorden = formatWordList(woorden);
    let bericht = saksData.berichten[Math.floor(Math.random() * saksData.berichten.length)].replace("{WOORD}", berichtWoorden);
    interaction.channel.send(bericht);

    if (diffHours < saksData.urenTotVolleStraf && diffHours >= saksData.urenTotKleineSpanjool)
    {
        common.klokRol(message, [gebruiker.username, saksData.kleineSpanjoolTijd, "Automatische spanjolering door Marvin, verminderde straf."], "s");
    }
    else
    {
        common.klokRol(message, [gebruiker.username, "Automatische spanjolering door Marvin."], "s");
    }
}

function findMatchedWords (sentence, woordenlijst)
{
    const results = [];

    // normalise to lowercase for case-insensitive matching
    const lowerSentence = sentence.toLowerCase();

    for (const item of woordenlijst)
    {
        const word = item.woord.toLowerCase();

        // Check for full-word match using word boundaries
        const fullWordRegex = new RegExp(`\\b${word}\\b`, 'i');
        const fullWord = fullWordRegex.test(sentence);

        // Check for partial-word match (contains word anywhere)
        const partial = lowerSentence.includes(word);

        if (partial && (!item.enkelHeelWoord || fullWord))
        {
            results.push({
                word: word,
                fullWord: fullWord,
                replacement: item.vervanging.toLowerCase()
            });
        }
    }

    // Deduplicate results by both word and fullWord
    const unique = [];
    for (const r of results)
    {
        if (!unique.some(u => u.word === r.word && u.fullWord === r.fullWord))
        {
            unique.push(r);
        }
    }

    return unique;
}

function formatWordList (matches)
{
    // Extract only the 'word' field
    const words = matches.map(m => m.replacement);

    // Remove duplicates (same spelling, regardless of fullWord)
    const uniqueWords = [...new Set(words)];

    if (uniqueWords.length === 0) return '';
    if (uniqueWords.length === 1) return uniqueWords[0];
    if (uniqueWords.length === 2) return `${uniqueWords[0]} en ${uniqueWords[1]}`;

    // Join with commas, and add 'en' before the last
    const lastWord = uniqueWords.pop();
    return `${uniqueWords.join(', ')} en ${lastWord}`;
}

function geefBrutaalCommentaar ()
{
    var opmerkingen = [
        "nee tyf op, ik heb hier geen zin in",
        "Ik heb hier geen zin in, jij hebt hier eigenlijk geen zin in. Weet je, we doen het gewoon niet.",
        "Nouh nee",
        "En wat wil je precies dat ik ga doen? Want wat je net voorstelde ben ik niet bekend mee, flapdrol.",
        "Zoek het effe lekker uit",
        "Gaan we niet doen",
        "Ik dacht het dus even niet, jij wandelend gezwel",
        "ikzitinjemurenikzitinjemurenikzitinjemurenikzitinjemurenikzitinjemurenikzitinjemurenikzitinjemuren",
    ];

    let nummertje = Math.floor(Math.random() * opmerkingen.length);
    return opmerkingen[nummertje];
}

function rookMelding (niveau, author)
{
    var random = Math.floor((Math.random() * 2) + 1);
    switch (niveau)
    {
        case "0":
            if (random === 1)
            {
                return `${author} is nog op planeet Aarde en verlangd nu simpelweg naar een reis in het universum.`;
            } else
            {
                return (`Wat doet het toch pijn om compleet nuchter te zijn, zo voelt ${author} zich vast ook.`);
            }
        case "1":
            return `Nou, ${author} is van de grond gekomen maar de ruimte lijkt nog erg ver te zijn!`;
        case "2":
            return (`${author} is net uit de atmosfeer betreed nu het heelal, de reis gaat van start maar we zijn er nog lang niet!`);
        case "3":
            return (`Langzaamaan zwevend door het heelal streeft ${author} nu net onze Maan voorbij. Een kleine rook voor ${author}, een grote rook voor de mensheid!`);
        case "4":
            return (`Het gaat al erg lekker, ${author} zoeft nu flink door ons zonnestelsel. Net de ringen van Saturnus ontwijkend gaan we verder!`);
        case "5":
            return (`Wauw! ${author} gaat al verder dan de mensheid bereikt heeft. Mokersnel en mokerlekker vliegend al diep de ruimte in, net voorbij de ~~planeet~~ Pluto!`);
        case "6":
            return (`Nondeju, wat gaat dit vlug. ${author} dendert al door onze intergalaktische buurt heen en racet langs allerlei verschillende zonnestelsels. Die zit nu al echt dik ver in het heelal, netjes!`);
        case "7":
            return (`Het is op dit punt dat je gaat merken dat tijd echt relatief is. ${author} gaat al hard genoeg dat uren minuten lijken en minuten zomaar uren kunnen worden. Een eeuw lijkt lang maar zo diep in het heelal is het maar een kleine hoeveelheid`);
        case "8":
            return (`Het is op dit punt dat communicatie ook een moeilijke opgave wordt, ${author} is namelijk al zo ver weg heen. Racend door het heelal scheurt ${author} onze Melkweg uit. Wie had gedacht dat een mens zo hard kon gaan.`);
        case "9":
            return (`Godnondetering, het gaat nu zo verdomd hard. Onaanspreekbaar, vaag als de neten maar wel vliegensvlug. Dat is ${author} in een notendop nu deze voorbij alle superclusters heen ramt. Het universum is nu van jou.`);
        case "10":
            return (`Tering. Op dit punt reist ${author} niet meer door het universum maar is ${author} nu het universum. Alles ligt nu binnen handbereik, alles is mogelijk. We komen nu tot de diepste hoeken, de verste planeten en mooiste nebula's. Dit is een met het universum zijn op zijn piek, lekker!`);
        case "11":
            return (`Oef. ${author} ging zo hard dat deze recht in een zwart gat gevlogen is. Het was leuk je gekend te hebben.`);
        case "42":
            return ('Dit is het ultieme antwoord maar joost mag weten wat de exacte vraag zou zijn.');
        case "69":
            return ('haha, 69 is het seksgetal, ik snap hem. Heel grappig, hoor.');
        case "420":
            return (`Krijg, nou, de sodetering. Deze malle man deed het gewoon, hij vulde het wietgetal in. Het. Wiet. Getal. Wat een ongelooflijke held is ${author} ook`);
        case "1337":
            return (`w0w, d17 15 3ch7 33n 3p15ch3 5p3l3rm0m3n7. kunn3n w3 h13rv00r 33n d3p kr1j63n?!`);
        default:
            return ("brein kapot.");
    }
}