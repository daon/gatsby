/**
 * @jest-environment node
 */
const path = require(`path`)
const fs = require(`fs`)
const Promise = require(`bluebird`)

const { onCreateNode } = require(`../gatsby-node`)

const {
  graphql,
  GraphQLObjectType,
  GraphQLList,
  GraphQLSchema,
} = require(`gatsby/graphql`)
const {
  inferObjectStructureFromNodes,
} = require(`../../../gatsby/src/schema/infer-graphql-type`)

const readFile = file =>
  new Promise((resolve, reject) => {
    fs.readFile(
      path.join(__dirname, `fixtures`, file),
      null,
      (err, content) => (err ? reject(err) : resolve(content))
    )
  })

describe.only(`Process PDF content correctly`, () => {
  const node = {
    name: `nodeName`,
    id: `whatever`,
    parent: `SOURCE`,
    children: [],
    internal: {
      contentDigest: `whatever`,
      mediaType: `application/pdf`,
      name: `test`,
    },
  }

  // Make some fake functions its expecting.
  const loadNodeContent = node => Promise.resolve(node.content)

  describe(`Process generated pdf node correctly`, () => {
    it(`correctly creates nodes from PDF with multiple pages`, async () => {
      node.content = await readFile(`multiple-pages.pdf`)

      const createNode = jest.fn()
      const createParentChildLink = jest.fn()
      const actions = { createNode, createParentChildLink }
      const createNodeId = jest.fn()
      createNodeId.mockReturnValue(`uuid-from-gatsby`)

      await onCreateNode({
        node,
        loadNodeContent,
        actions,
        createNodeId,
      }).then(() => {
        expect(createNode.mock.calls).toMatchSnapshot()
        expect(createParentChildLink.mock.calls).toMatchSnapshot()
        expect(createNode).toHaveBeenCalledTimes(1)
        expect(createParentChildLink).toHaveBeenCalledTimes(1)
      })
    })

    it(`correctly creates a node from PDF with one page`, async () => {
      node.content = await readFile(`one-page.pdf`)

      const createNode = jest.fn()
      const createParentChildLink = jest.fn()
      const actions = { createNode, createParentChildLink }
      const createNodeId = jest.fn()
      createNodeId.mockReturnValue(`uuid-from-gatsby`)

      await onCreateNode({
        node,
        loadNodeContent,
        actions,
        createNodeId,
      }).then(() => {
        expect(createNode.mock.calls).toMatchSnapshot()
        expect(createParentChildLink.mock.calls).toMatchSnapshot()
        expect(createNode).toHaveBeenCalledTimes(1)
        expect(createParentChildLink).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe(`process graphql correctly`, () => {
    // given a set of nodes and a query, return the result of the query
    async function queryResult(nodes, fragment, { types = [] } = {}) {
      const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
          name: `RootQueryType`,
          fields: () => {
            return {
              listNode: {
                name: `LISTNODE`,
                type: new GraphQLList(
                  new GraphQLObjectType({
                    name: `Pdf`,
                    fields: inferObjectStructureFromNodes({
                      nodes,
                      types: [...types],
                    }),
                  })
                ),
                resolve() {
                  return nodes
                },
              },
            }
          },
        }),
      })
      const result = await graphql(
        schema,
        `query {
                  listNode {
                      ${fragment}
                  }
              }
              `
      )
      return result
    }

    it(`Correctly queries number of pages and metadata for a node`, async done => {
      node.content = await readFile(`one-page.pdf`)

      let createdNode
      const createNode = pdfNode =>
        queryResult(
          [pdfNode],
          `
                    numberOfPages
                    metadata {
                        subject
                    }
                `,
          { types: [{ name: `Pdf` }] }
        ).then(result => {
          try {
            createdNode = result.data.listNode[0]
            expect(createdNode).toMatchSnapshot()
            expect(createdNode.numberOfPages)
              .toBe(1)
            expect(createdNode.metadata.subject).toBe(`Subject`)
            done()
          } catch (err) {
            done.fail(err)
          }
        })

      const createParentChildLink = jest.fn()
      const actions = { createNode, createParentChildLink }
      const createNodeId = jest.fn()
      createNodeId.mockReturnValue(`uuid-from-gatsby`)

      onCreateNode({
        node,
        loadNodeContent,
        actions,
        createNodeId,
      })
    })
  })
})
