import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
        <link rel='icon' href='../static/icon.png' sizes='any' />
      </Head>
      <body>
      <div id={'cred-modal'}></div>
      <Main />
      <NextScript />
      </body>
    </Html>
  );
}
