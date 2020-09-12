function applyRandCSS(){
  var css = ["css/landing-tiger.css", "css/landing-neon.css", "css/landing-nature.css","css/landing-lava.css","css/landing-book.css"];
  var randomFile = css[Math.round(Math.random()*(css.length-1))];
  var ss = document.createElement("link");

  ss.type = "text/css";
  ss.rel = "stylesheet";
  ss.href = randomFile;

  document.getElementsByTagName("head")[0].appendChild(ss);
}
