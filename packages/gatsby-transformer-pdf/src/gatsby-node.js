const crypto = require(`crypto`)
const pdfjs = require(`pdfjs-dist`)

function getKeywords(str = ``) {
  const keywords = str.split(`,`)
  return keywords.map(keyword => keyword.trim())
}

function getDate(str = ``) {
  const pattern = /D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/
  const result = str.match(pattern)
  if (result && result.length === 7) {
    return new Date(
      `${result[1]}-${result[2]}-${result[3]} ${result[4]}:${result[5]}:${
        result[6]
      }`
    ).toJSON()
  }
  return str
}

async function getMetadata(document) {
  const { info } = await document.getMetadata()
  return {
    title: info.Title || ``,
    author: info.Author || ``,
    subject: info.Subject || ``,
    keywords: getKeywords(info.Keywords),
    creator: info.Creator || ``,
    createdDate: getDate(info.CreationDate),
    modifiedDate: getDate(info.ModDate),
    pdfVersion: info.PDFFormatVersion,
  }
}

function getText(textContent) {
  return textContent.items.map(item => item.str.trim()).join(` `)
}

async function getPages(document) {
  const pages = []
  for (let i = 1; i <= document.numPages; i++) {
    const page = await document.getPage(i)
    const textContent = await page.getTextContent()
    const text = getText(textContent)
    pages.push({ pageNumber: page.pageNumber, text })
  }
  return pages
}

async function onCreateNode({ node, boundActionCreators, loadNodeContent, createNodeId }) {
  const { createNode, createParentChildLink } = boundActionCreators

  function transformObject(obj, id, type) {
    const objStr = JSON.stringify(obj)
    const contentDigest = crypto
      .createHash(`md5`)
      .update(objStr)
      .digest(`hex`)
    const pdfNode = {
      ...obj,
      id,
      children: [],
      parent: node.id,
      internal: {
        contentDigest,
        type,
      },
    }
    createNode(pdfNode)
    createParentChildLink({ parent: node, child: pdfNode })
  }

  // We only care about pdf content.
  if (
    node.internal.mediaType !== `application/pdf` &&
    node.internal.mediaType !== `application/x-pdf`
  ) {
    return
  }

  const content = await loadNodeContent(node)
  let pdfNode = {
    error: null,
    numberOfPages: 0,
    metadata: {},
    pages: [],
  }
  try {
    const document = await pdfjs.getDocument(content)
    const metadata = await getMetadata(document)
    const pages = await getPages(document)

    pdfNode = {
      ...pdfNode,
      numberOfPages: document.numPages,
      metadata,
      pages,
    }
  } catch (e) {
    const error = {
      err: true,
      code: e.code,
      message: e.message,
      stack: e.stack,
    }
    pdfNode = {
      ...pdfNode,
      error,
    }
  }

  transformObject(pdfNode, createNodeId(`${node.id} >>> Pdf`), `Pdf`)
}

exports.onCreateNode = onCreateNode
