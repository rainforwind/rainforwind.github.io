var converter = new showdown.Converter();

fetch('resource/test.md')
  .then(response => response.text())
  .then(data => document.getElementById("doc").innerHTML = converter.makeHtml(data))
  .catch(error => console.error(error));
