function BookingidGenerator(shortname,min, max) {

    let mathscal=Math.floor(Math.random() * (max - min + 1) + min+(Date.now() / 1000));
let converstion=shortname+mathscal;
   return converstion;
  }
  module.exports = BookingidGenerator;