# gatsby-transformer-pdf

Parses Pdf files using [PDF.js](https://github.com/mozilla/pdfjs-dist).

## Install

`npm install --save gatsby-transformer-pdf`

## How to use

```javascript
// In your gatsby-config.js
plugins: [`gatsby-transformer-pdf`]
```

Ensure that there's an instance of `gatsby-source-filesystem` that's pointed at your source code e.g.

```javascript
plugins: [
  `gatsby-transformer-pdf`,
  {
    resolve: `gatsby-source-filesystem`,
    options: {
      name: `source`,
      path: `${__dirname}/../src/`,
    },
  },
]
```

## Parsing algorithm

It recognizes files with the following extensions as PDF:

- pdf

Each PDF file is parsed into a node of type `Pdf`.

## How to query

A sample GraphQL query to get PDF nodes:

```graphql
{
  allPdf {
    edges {
      node {
        metadata {
          title
          author
          subject
          keywords
          creator
          createdDate
          modifiedDate
          pdfVersion
        }
        numberOfPages
        pages {
          pageNumber
          text
        }
      }
    }
  }
}
```

Which would return something like:

```javascript
{
  allPdf: {
    edges: [
      {
        node: {
          metadata: {
            title: "My PDF Document",
            author: "John Doe",
            subject: "GatsbyJS",
            keywords: ["GatsbyJS", "JS", "React"],
            creator: "Microsoft Word",
            createdDate: "2018-08-20T03:56:50.879Z",
            modifiedDate: "2018-08-20T03:56:50.879Z",
          },
          numberOfPages: 2,
          pages: [
            {
              pageNumber: 1,
              text: "Page 1 content",
            },
            {
              pageNumber: 2,
              text: "Page 2 content",
            },
          ],
        },
      },
    ]
  }
}
```
