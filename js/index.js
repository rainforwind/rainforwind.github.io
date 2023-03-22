let converter = new showdown.Converter();

// const queryString = window.location.search
// const urlParams = new URLSearchParams(queryString);


function preReplace(markdownWithVar, docList) {
  const dirMarkdown = '\n\n' + docList.map(doc => {
    return `- [${doc.title}](#${doc.path})`;
  })
    .filter(element => element)
    .join('\n\n');

  const tagList = '\n\n' + docList.map(doc => {
    return doc.tags;
  })
    .reduce((pre, current) => { return [... new Set([...pre, ...current])] }, [])
    .map(tag => `<a onclick="showMenu('${tag}')">${tag}</a>`)
    .join('\n\n');

  return markdownWithVar.replaceAll(/\$doclist\((.*?)\)/g, dirMarkdown).replaceAll(/\$taglist\((.*?)\)/g, tagList);
}

function renderMd(docPath, docList) {
  fetch(docPath)
    .then(response => {
      if (response.status === 200) {
        return response.text()
      }
      console.log(response);
      return Promise.reject("fetch failed with status: " + response.status)
    })
    .then(async (data) => {
      const markdown = preReplace(data, docList);
      document.getElementById("doc").innerHTML = converter.makeHtml(markdown);
    }
    )
    .catch(error => {
      console.error(error);
      const docNotFoundMD = '# Document [' + docPath + '] not found!';
      document.getElementById("doc").innerHTML = converter.makeHtml(docNotFoundMD);
    });
}

(async () => {
  /**
   * @returns promise, list of file names;
   */
  async function getDocList() {
    let mode;
    if (window.location.hostname === 'rainforwind.github.io') {
      mode = 'github';
    } else {
      mode = 'python3';
    }

    const docListPath = ''; // replace with doclist function param in the future.

    let apiPath;
    switch (mode) {
      case 'python3': // python3 -m http.server
        apiPath = `/doc${docListPath}`;
        break;
      default: // 'github' by default
        apiPath = `https://api.github.com/repos/rainforwind/rainforwind.github.io/contents/doc${docListPath}?ref=draft`;
    }

    return fetch(apiPath)
      .then(res => {
        switch (mode) {
          case 'python3':
            return res.text();
          default: // 'github' by default
            return res.json();
        }
      })
      .then(dirContent => {
        let fileList;
        switch (mode) {
          case 'python3':
            fileList = [...dirContent.matchAll(/<a href=".*">(.*)<\/a>/g)].map(match => match[1])
            break;
          default: // 'github' by default
            fileList = dirContent.map(file => file.name);
        }

        return fileList;
      })
      .catch(error => {
        console.log(error);
        return markdownWithVar;
      })
  }
  const docList = (await getDocList()).map(
    file => {
      const fileName = file.substring(0, file.length - 3)
      const tokens = fileName.split(',');
      let tags;
      if (tokens.length <= 2) {
        tags = [];
      } else {
        tags = tokens.slice(2);
      }
      return { time: tokens[0], path: fileName, title: tokens[1], tags: tags }
    }
  );

  function renderDoc() {
    let doc = window.location.hash
    let docPath;
    if (!doc || doc.length <= 1) {
      docPath = 'index.md';
    } else {
      docPath = 'doc/' + doc.substring(1) + '.md';
    }

    let customPath = '';
    if (customPath == '/' || customPath == '.') {
      customPath = '';
    } else {
      if (customPath.charAt(0) != '/') {
        customPath = '/' + customPath;
      }
      if (customPath.charAt(customPath.length - 1) == '/') {
        customPath = customPath.substring(0, customPath.length - 1);
      }
    }

    renderMd(docPath, docList);
  }

  addEventListener('hashchange', event => { renderDoc() });
  renderDoc();

  window.showIndex = () => {
    renderMd('index.md', docList);
  }

  window.showMenu = (tag) => {
    if (tag) {
      console.log (tag, docList)
      renderMd('menu.md', docList.filter(
        doc => doc.tags.includes(tag)
      ));
    } else {
      renderMd('menu.md', docList);
    }
  }

  window.showTags = () => {
    renderMd('tags.md', docList);
  }

  window.showAbout = () => {
    renderMd('about.md', docList);
  }
})();