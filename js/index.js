let converter = new showdown.Converter({ tables: true });

// const queryString = window.location.search
// const urlParams = new URLSearchParams(queryString);

let errMsg = '';

function logError(error) {
  errMsg = error;
  console.error(error);
};

const siteName = '如风小鸽';

function generateReplacements(ctx, match, funcName, argString) {
  if (funcName === 'doclist') {
    let limit;
    if (argString) {
      limit = JSON.parse(argString).limit;
    }
    return '\n\n' + ctx.docList.map(doc => {
      if (limit == null) {
        return `- [${doc.title}](#${doc.path})`;
      } else if (limit > 0) {
        limit--;
        return `- [${doc.title}](#${doc.path})`;
      } else {
        return '';
      }
    })
      .filter(element => element) // remove empty
      .join('\n\n');

  } else if (funcName === 'taglist') {
    return '\n\n' + ctx.docList.map(doc => {
      return doc.tags;
    })
      .reduce((pre, current) => { return [... new Set([...pre, ...current])] }, [])
      .map(tag => `- <a onclick="showMenu('${tag}')" href="#^">${tag}</a>`)
      .join('\n\n');

  }
  // not replaced, return matched string
  return match;
}

function preReplace(markdownWithVar, docList) {
  let ctx = { docList: docList };
  if (typeof (markdownWithVar.replaceAll) === 'function') {
    return markdownWithVar.replaceAll(/\$(\w+)\((.*?)\)/g, (...matchArgs) => generateReplacements(ctx, ...matchArgs));
  } else {
    logError('String.prototype.replaceAll not supported')
    return markdownWithVar;
  }
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
      logError(error);
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
        logError(error);
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
  ).sort((a, b) => (a.time == b.time ? 0 : (a.time < b.time ? 1 : -1)));

  function renderDoc() {
    let doc = window.location.hash
    if (doc === "#^") {
      return;
    }
    let docInfo;
    if (!doc || doc.length <= 1) {
      docInfo = { path: 'index.md', title: null };
    } else {
      const fileCoreName = decodeURI(doc).substring(1)
      if (fileCoreName == '^menu') {
        docInfo = { path: 'menu.md', title: '目录' };
      } else {
        docInfo = { path: 'doc/' + fileCoreName + '.md', title: fileCoreName.split(',')[1] };
      }
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
    renderMd({ path: 'index.md', title: null }, docList);
  }

  window.showMenu = (tag) => {
    if (tag) {
      renderMd({ path: 'menu.md', title: tag }, docList.filter(
        doc => doc.tags.includes(tag)
      ));
    } else {
      renderMd({ path: 'menu.md', title: '目录' }, docList);
    }
  }

  window.showTags = () => {
    renderMd({ path: 'tags.md', title: '标签' }, docList);
  }

  let errMsgCnt = 0;
  let errMsgTime = 0;

  window.showAbout = () => {
    const timestamp = Date.now();
    if (timestamp - errMsgTime > 1000) {
      errMsgCnt = 1;
    } else {
      errMsgCnt += 1;
    }
    errMsgTime = timestamp;

    if (errMsgCnt >= 5) {
      alert(errMsg);
    }

    renderMd({ path: 'about.md', title: '关于' }, docList);
  }
})();
