import type { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Tooltip } from 'reactstrap';
import { up } from 'styled-breakpoints';
import styled from 'styled-components';
import { FindUs } from '../components/homepage/FindUs';
import { Packages } from '../components/homepage/Packages';
import { PageContainer, PageMain } from '../components/homepage/Page';

const Title = styled.h1`
  margin: 0;
  line-height: 1.15;

  font-size: 3rem;
  font-weight: 300;
  font-family: ${(p) => p.theme.fonts.rapida};
  text-align: center;

  ${up('md')} {
    font-size: 4rem;
  }
`;

const Description = styled.p`
  margin: 1.5em 0;
  max-width: 800px;
  font-family: ${(p) => p.theme.fonts.rapida};
  font-size: 1.3rem;
  text-align: center;
  line-height: 1.5;

  ${up('md')} {
    font-size: 1.5rem;
  }
`;

const Warning = styled.div`
  background-color: #fff399;
  border-radius: 5px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  max-width: 700px;
  text-align: center;
  margin-bottom: 3em;

  p:last-child {
    margin-bottom: 0;
  }

  ${up('md')} {
    font-size: 1.2rem;
    padding: 2rem;
  }
`;

const Home: NextPage = () => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 3000);
    }
  }, [copied]);

  return (
    <PageContainer>
      <Head>
        <title>rápida - interactive content for the web</title>
        <meta
          name="description"
          content="rapida helps you create interactive content for the web"
        />
      </Head>

      <PageMain>
        <Title>rápida</Title>

        <Description>
          rapida helps you create interactive content for the web &#x1f919;
        </Description>

        <Packages />

        <Warning>
          <p>&#9888; &#9888; &#9888;</p>
          <p>
            <strong>
              This project is under active alpha development. We do not
              recommend using rapida in production just yet, but watch this
              space!
            </strong>
          </p>
          <p>
            Docs are currently WIP - there are only auto-generated docs here
            right now. Getting started docs and worked examples will be added
            soon.
          </p>
          <p>
            Things will{' '}
            <em>
              change and break <strong>regularly</strong>
            </em>
            . We are still experimenting, so you can expect usage to change with
            each release right now.
          </p>
          <p>&#9888; &#9888; &#9888;</p>
        </Warning>

        <FindUs />
      </PageMain>
    </PageContainer>
  );
};

export default Home;
