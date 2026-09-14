<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            color: #333;
            max-width: 75rem;
            margin: 0 auto;
            padding: 2rem;
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 0px;
          }
          p.description {
            color: #666;
            margin-bottom: 2rem;
            font-size: 0.9rem;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            font-size: 0.9rem;
          }
          th {
            background-color: #f5f5f5;
            text-align: left;
            padding: 10px 15px;
            border-bottom: 1px solid #ddd;
            font-weight: 600;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #555;
          }
          td {
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
            word-break: break-all;
          }
          tr:hover td {
            background-color: #fcfcfc;
          }
          a {
            color: #3b82f6;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .count {
            float: right;
            font-size: 0.9rem;
            font-weight: normal;
            color: #888;
            margin-top: 5px;
          }
          .badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            margin-left: 8px;
          }
        </style>
      </head>
      <body>
        <xsl:choose>
          <!-- Sitemap Index (sitemapindex) -->
          <xsl:when test="sitemap:sitemapindex">
            <h1>
              XML Sitemap Index
              <span class="count">
                Total Sitemaps: <xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/>
              </span>
            </h1>
            <p class="description">
              This XML Sitemap Index contains links to sub-sitemaps. Click on a sitemap to view its URLs.
            </p>
            <table>
              <thead>
                <tr>
                  <th width="70%">Sitemap URL</th>
                  <th width="30%">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                  <tr>
                    <td>
                      <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                    </td>
                    <td>
                      <xsl:value-of select="concat(substring(sitemap:lastmod,0,11),' ', substring(sitemap:lastmod,12,5))"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:when>

          <!-- Regular Sitemap (urlset) -->
          <xsl:otherwise>
            <h1>
              XML Sitemap
              <span class="count">
                Total URLs: <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
              </span>
            </h1>
            <p class="description">
              This XML Sitemap is generated to help search engines crawl the website content.
            </p>
            <table>
              <thead>
                <tr>
                  <th width="70%">URL</th>
                  <th width="30%">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td>
                      <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                    </td>
                    <td>
                      <xsl:value-of select="concat(substring(sitemap:lastmod,0,11),' ', substring(sitemap:lastmod,12,5))"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:otherwise>
        </xsl:choose>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
