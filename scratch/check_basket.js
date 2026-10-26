const sharp = require('sharp');

async function run() {
  const m1 = await sharp('C:/Users/denis/.gemini/antigravity-ide/brain/23e430df-6a3b-41bd-a41b-57ec02906b9f/.user_uploaded/media_1792784292797.png').raw().toBuffer({resolveWithObject: true});
  console.log('channels:', m1.info.channels);
  for(let y=0; y<3; y++) {
    for(let x=0; x<3; x++) {
      const idx = (y * m1.info.width + x) * m1.info.channels;
      console.log('x=' + x + ', y=' + y + ': R=' + m1.data[idx] + ', G=' + m1.data[idx+1] + ', B=' + m1.data[idx+2] + (m1.info.channels === 4 ? ', A=' + m1.data[idx+3] : ''));
    }
  }
}
run();
