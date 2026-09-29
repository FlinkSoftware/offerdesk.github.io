// Typewriter effect for "Suitable For" section
!function(){
  function initTypewriter(){
    const typesElement = document.getElementById("types");
    if(!typesElement) return;

    const types = (typesElement.dataset.types || "").split(",").map(t => t.trim()).filter(Boolean);
    const defaultTypes = types.length ? types : ["vloerenbedrijven","CV-installateurs","zonnepaneelinstallateurs","elektriciens","loodgieters","schilders","onderhoudsbedrijven","servicebedrijven"];

    if(typeof window.Typewriter !== "function") {
      typesElement.textContent = defaultTypes[0] || "installateurs";
      return;
    }

    const typewriter = new window.Typewriter(typesElement, {
      loop: true,
      autoStart: true,
      delay: 55,
      deleteSpeed: 35,
      cursor: "|"
    });

    defaultTypes.forEach(type => {
      typewriter.typeString(type).pauseFor(1200).deleteAll();
    });

    if(typeof typewriter.start === "function") {
      typewriter.start();
    }
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", initTypewriter)
    : initTypewriter();
}();


