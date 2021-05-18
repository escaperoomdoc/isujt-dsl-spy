import { Telegraf } from 'telegraf';

/*
const bot = new Telegraf(process.env.TELEBOT_TOKEN);

bot.start(async ctx => {
    try {
        await chats.create({
            id: ctx.message.chat.id
        })
    }
    catch (e) {}
    ctx.reply(`Привет, вы подписались на события!`)
})
bot.command('weather', async ctx => {
    if (ctx.message.text.length > ctx.message.entities[0].length) {
        let temperature = await getTemperature(ctx.message.text.substring(ctx.message.entities[0].length+1));
        ctx.reply(temperature);
    }
    else ctx.reply('Введите название города сразу после команды. Например: /weather Москва');
})
index.launch()
process.once('SIGINT', () => index.stop('SIGINT'));
process.once('SIGTERM', () => index.stop('SIGTERM'));



const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    "dialect": "sqlite",
    "storage": "database.sqlite"
});
sequelize.authenticate();
const chats = sequelize.define("chats",
    {
        id: {
            type: Sequelize.UUID,
            primaryKey: true
        }
    });
sequelize.sync();

setInterval(async () => {
    let chatsArray = await chats.findAll({raw: true})
    console.log(chatsArray)
    let now = new Date();
    for (const chat of chatsArray) {
        bot.telegram.sendMessage(chat.id, now.toString())
    }
}, 10000)



const puppeteer = require('puppeteer');

async function getTemperature(city) {
    try {
        const browser = await puppeteer.launch({
            headless: false
        });
        const page = await browser.newPage();
        await page.goto('https://yandex.ru/pogoda');
        // await page.type('body > header > div > form > div > input', 'Москва');
        let [input] = await page.$x('/html/body/header/div/form/div/input ');
        await input.type(city);
        await page.keyboard.press('Enter');
        await page.waitForXPath('/html/body/div[1]/div[4]/div[2]/div/div[1]/div/li/a');
        let [place] = await page.$x('/html/body/div[1]/div[4]/div[2]/div/div[1]/div/li/a');
        place.click();
        await page.waitForNavigation();
        await page.waitForXPath('/html/body/div[1]/div[3]/div[2]/div[1]/div[5]/a/div[1]/span[2]');
        let [temperatureEl] = await page.$x('/html/body/div[1]/div[3]/div[2]/div[1]/div[5]/a/div[1]/span[2]');
        let temperature = await page.evaluate(el => el.textContent, temperatureEl)
        await browser.close();
        return temperature
    }
    catch (e) {
        return e
    }

}
*/
