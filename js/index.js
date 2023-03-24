let converter = new showdown.Converter({ tables: true });

// const queryString = window.location.search
// const urlParams = new URLSearchParams(queryString);

const siteName = '如风小鸽';

function preReplace(markdownWithVar, docList) {
  const dirMarkdown = '\n\n' + docList.map(doc => {
    return `- [${doc.title}](#${doc.path})`;
  })
    .filter(element => element)
    .join('\n\n');

  const tagListMd = '\n\n' + docList.map(doc => {
    return doc.tags;
  })
    .reduce((pre, current) => { return [... new Set([...pre, ...current])] }, [])
    .map(tag => `- <a onclick="showMenu('${tag}')" href="#^">${tag}</a>`)
    .join('\n\n');

  return markdownWithVar.replaceAll(/\$doclist\((.*?)\)/g, dirMarkdown).replaceAll(/\$taglist\((.*?)\)/g, tagListMd);
}

function renderMd(docInfo, docList) {
  fetch(docInfo.path)
    .then(response => {
      if (response.status === 200) {
        return response.text()
      }
      console.debug(response);
      return Promise.reject("fetch failed with status: " + response.status)
    })
    .then(async (data) => {
      const markdown = (docInfo.title ? `# ${docInfo.title}\n\n` : '') + preReplace(data, docList);
      document.getElementById("doc").innerHTML = converter.makeHtml(markdown);
      if (docInfo.title) {
        document.title = docInfo.title;
      } else {
        document.title = siteName;
      }
    }
    )
    .catch(error => {
      console.error(error);
      const docNotFoundMD = '# Document [' + docInfo.path + '] not found!';
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
    if (doc === "#^") {
      return;
    }
    let docInfo;
    if (!doc || doc.length <= 1) {
      docInfo = {path: 'index.md', title: null};
    } else {
      const fileCoreName = decodeURI(doc).substring(1)
      docInfo = {path: 'doc/' + fileCoreName + '.md', title: fileCoreName.split(',')[1]};
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

    renderMd(docInfo, docList);
  }

  addEventListener('hashchange', event => renderDoc());
  renderDoc();

  window.showIndex = () => {
    renderMd({path: 'index.md', title: null}, docList);
  }

  window.showMenu = (tag) => {
    if (tag) {
      renderMd({path: 'menu.md', title: tag}, docList.filter(
        doc => doc.tags.includes(tag)
      ));
    } else {
      renderMd({path: 'menu.md', title: '目录'}, docList);
    }
  }

  window.showTags = () => {
    renderMd({path: 'tags.md', title: '标签'}, docList);
  }

  window.showAbout = () => {
    renderMd({path: 'about.md', title: '关于'}, docList);
  }
})();