fetch('README.md')
  .then(response => response.text())
  .then(data => console.log(data))
  .catch(error => console.error(error));