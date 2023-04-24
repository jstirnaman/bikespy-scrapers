import { timeStamp } from 'console';
import fs, { mkdir } from 'fs';
import got from 'got';
import jsdom from 'jsdom';

const { JSDOM } = jsdom;

export function scraper(options) {
  options = options || {
    url: '',
    logLevel: 'info'
  }

  return {
    get: async () => {
      return await got(options.url);
    },
    config: () => {
      return console.log(JSON.stringify(options));
    }
  }
}

export function surly() {
  const rootUrl = 'https://surlybikes.com';
  const urls = ['https://surlybikes.com/bikes/legacy'];
  
  urls.forEach(async url => {
    const doc = await scraper({url}).get();
    const dom = new JSDOM(doc.body);

    let linkList = [
      ...dom.window.document.querySelector('#bike_flyout')
     .querySelectorAll('a[href*=bikes]')
    ];
    linkList.forEach(link => {
      console.log(link.href);
    });

    const itemList = dom.window.document.querySelector('.product-list');
    linkList = [...itemList.querySelectorAll('.product-listing a')];
    linkList.forEach(link => {
      console.log(link.href);
    });
    
    let imgList = [...itemList.querySelectorAll('img[class*=product-image]')];
    imgList.forEach(img => {
      const imgUrl = img.getAttribute('data-src');
      download(imgUrl,null,'surly')
    });
  });
}

function download(url, fileName, brand) {
  const images = process.env.IMAGES_DIR || 'images'

  mkdir(`${images}/${brand}`, (err) => {
    if(err.code !== 'EEXIST') {
      throw err;
    }
  });

  fileName = fileName || (new URL(url)).pathname.split('/').slice(-1);

  const metadata = `${url} | ${brand} | ${fileName} | ${Date.now()}`;

  got.stream(`${url}/${fileName}`)
  .on('error', err => { console.log(err); console.log(`Error on ${url}/${fileName}`) })
  .pipe(fs.createWriteStream(`${images}/${brand}/${fileName}`))
  .on('error', err => { 
    console.log(err); console.log(`Error on ${url}/${fileName}`)
    writeMetadata(err);
  })
  .on('finish', () => {
    console.log(`Downloaded: ${fileName}`);
    writeMetadata('ok');
  })

  const writeMetadata = (err) => 
    fs.appendFile(`${images}/${brand}/images-metadata.txt`,
    `${metadata} | ${err} \n`, 'utf-8', err => {
      if (err) throw err;
    })
}

surly()