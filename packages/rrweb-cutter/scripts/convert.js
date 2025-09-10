import fs from 'node:fs/promises';
import { S3Client, ListObjectsCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';
//import rrdomNodejs from 'rrdom-nodejs';
//import rrdom from 'rrdom';
//import rrtypes from '@rrweb/types';
import { JSDOM } from 'jsdom';
import { EventType, SyncReplayer } from 'rrweb';
//import { SyncReplayer } from './packages/rrweb/src/replay/sync-replayer';
import puppeteer from 'puppeteer';

import { diff } from 'rrdom';

// Configure AWS SDK
const config = {
  region: process.env.aws_region,
	credentials: {
    accessKeyId: process.env.aws_access_key_id,
    secretAccessKey: process.env.aws_secret_access_key,
	}
};

const bucketName = 'sc-heatmap-snapshot';
const pid = process.env.npm_config_project_id ? process.env.npm_config_project_id : (
  process.env.npm_config_pid ? process.env.npm_config_pid : (
    process.env.pid ? process.env.pid : null))

async function main() {

	//const client = new S3Client({region: 'us-west-2'});
  const client = new S3Client(config);
  let input;
  if (pid !== null) {
    input = { // ListObjectsRequest
      Bucket: bucketName,
      Prefix: pid + '/',
    };
  } else {
    const input = { // ListObjectsRequest
      Bucket: bucketName,
    };
  }
	const command = new ListObjectsCommand(input);
	const response = await client.send(command);
  const lastModified = {};
	const zipfiles = [];
	response.Contents.forEach((finfo) => {
		lastModified[finfo.Key] = finfo.LastModified;  // Date object
		if (finfo.Key.endsWith('.gz')) {
			zipfiles.push(finfo.Key);
		} else {
			console.log(finfo.Key);
		}
  });
  let processed = 0;

  let check_puppeteer = process.env.check_puppeteer;
  if (process.env.filter_check) {
    check_puppeteer = true;
  }

  for (const gzKey of zipfiles) {

    if (process.env.filter_check) {
      if (!gzKey.includes(process.env.filter_check)) {
        continue;
      }
    }

		let htmlKey = gzKey.replace('.gz', '') + '.html';
		if (lastModified[htmlKey]) {
      if (lastModified[htmlKey].getTime() < lastModified[gzKey].getTime() || check_puppeteer) {
				console.log('Reprocessing ' + gzKey);
			} else {
        console.log('Already processed ' + gzKey);
        continue;
			}
		} else {
			console.log('Processing ' + gzKey);
		}

		// Get object from S3
		const params = {
			Bucket: bucketName,
			Key: gzKey,
		};
		const getCommand = new GetObjectCommand(params);
		const getResponse = await client.send(getCommand);
		//const bodyString = await getResponse.Body.transformToString();
		const bytePayload = await getResponse.Body.transformToByteArray();


		const unzip = promisify(gunzip);
		const jsonData = await unzip(bytePayload);
		//console.log('got jsonData ' + jsonData.length);
		const jsonStr = jsonData.toString();
    //console.log('got jsonStr ' + jsonStr.length + ' ' + jsonStr.substring(0, 40));

    let st = performance.now();
    const html = await processViaSyncReplayer(jsonStr, gzKey);
    const d1 = performance.now() - st;
    if (check_puppeteer) {
      st = performance.now();
      const html2 = (await processViaPuppeteer(jsonStr, gzKey)).replace(/\s?rrweb-paused/g, '').replace('<style></style><head', '<head');
      const d2 = performance.now() - st;
      console.log(`${Math.round(100*d1/d2)}% of slower puppeteer time (${Math.round(d1/1000, 2)}s vs. ${Math.round(d2/1000, 2)}s)`)
      if (html !== html2 && html.replace(/[\n\s]/g, '') !== html2.replace(/[\n\s]/g, '')) {
        console.log('got diff html ' + gzKey);
        await fs.writeFile(`./payload.json`, jsonData);
        await fs.writeFile(`./virtual-diff.html`, html);
        await fs.writeFile(`./puppeteer-diff.html`, html2);
        return;
      }
    }
    processed += 1;

    //console.log('got html ' + html.length + ' ' + html.substring(0, 40));
		await uploadToS3(client, html, bucketName, htmlKey);
  }
  console.log(`done, processed ${processed} files`);
}

async function launchPuppeteer(viewport) {
  return await puppeteer.launch({
	  headless: 'new',
	  defaultViewport: viewport,
	  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}


async function uploadToS3(client, html, bucketName, objKey) {
	const input = { // ListObjectsRequest
		Bucket: bucketName,
		Body: html,
		Key: objKey
	};
	const command = new PutObjectCommand(input);
  const response = await client.send(command);
	//console.log(response);
}


async function processViaSyncReplayer(jsonData, gzKey) {
	let viewport = {
		width: 1570,
		height: 3220, // longer viewport in the hope of thwarting css based lazyload
	};
	if (gzKey.includes('-mobile')) {
		// TODO: useragent?
		viewport = {
			width: 430,
			height: 3220, // longer viewport in the hope of thwarting css based lazyload
		};
  }
  const replayer = new SyncReplayer(JSON.parse(jsonData));
  replayer.play();
  const jsddocument = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
		url: "http://localhost",
		//pretendToBeVisual: true,
  });

  const replayerHandler = {
    mirror: replayer.getMirror(),
    applyCanvas: (
      canvasEvent,
      canvasMutationData,
      target,
    ) => {
      console.log('canvasMutation');
    },
    applyInput: () => {},
    applyScroll: () => {},
    applyStyleSheetMutation: (
      data,
      styleSheet,
    ) => {
      if (data.source === IncrementalSource.StyleSheetRule)
        console.log('StyleSheetRule mutation');
      else if (data.source === IncrementalSource.StyleDeclaration)
        console.log('StyleDeclaration mutation');
    },
    afterAppend: (node, id) => {
      // pass
    },
  };

  return replayer.virtualDom.outerHTML;
/*
  diff(jsddocument, replayer.virtualDom, replayerHandler, replayer.getMirror());
  console.log( jsddocument.serialize());

  const innerDoc = jsddocument.contentDocument;
	let doctype = '';
	if (innerDoc.doctype) {
		doctype = '<!DOCTYPE ' +
		  innerDoc.doctype.name +
		  (innerDoc.doctype.publicId?' PUBLIC "' +  innerDoc.doctype.publicId + '"':'') +
		  (innerDoc.doctype.systemId?' "' + innerDoc.doctype.systemId + '"':'') + '>';
	}
	if (innerDoc.documentElement.childNodes[0].tagName === 'STYLE') {
		innerDoc.documentElement.childNodes[0].remove()
	}
  return doctype + innerDoc.documentElement.outerHTML;
  */
}

async function processViaPuppeteer(jsonData, gzKey) {
	let viewport = {
		width: 1570,
		height: 3220, // longer viewport in the hope of thwarting css based lazyload
	};
	if (gzKey.includes('-mobile')) {
		// TODO: useragent?
		viewport = {
			width: 430,
			height: 3220, // longer viewport in the hope of thwarting css based lazyload
		};
	}
	const browser = await launchPuppeteer(viewport);
  const code = await fs.readFile(`../replay/dist/replay.umd.cjs`, 'utf-8');
	const page = await browser.newPage();
	await page.goto('about:blank');
	await page.evaluate(code);
	await page.evaluate(`var events = ${jsonData}`);
	const html = await page.evaluate(`
      const { Replayer } = rrweb;
      const replayer = new Replayer(events);
	  replayer.pause(10000000);
	  const innerDoc = replayer.iframe.contentDocument;
	  let doctype = '';
	  if (innerDoc.doctype) {
		doctype = '<!DOCTYPE ' +
		innerDoc.doctype.name +
		(innerDoc.doctype.publicId?' PUBLIC "' +  innerDoc.doctype.publicId + '"':'') +
		(innerDoc.doctype.systemId?' "' + innerDoc.doctype.systemId + '"':'') + '>';
	  }
	  if (innerDoc.documentElement.childNodes[0].tagName === 'STYLE') {
		innerDoc.documentElement.childNodes[0].remove()
	  }
	  doctype + innerDoc.documentElement.outerHTML;
	`);
	return html;
}

function processViaJSDOM(error, result) {
	console.log(error);
	if (error) {
		throw error;
		console.error(error);
	}
	const rrwebEvents = JSON.parse(result);
	console.log('processing {rrwebEvents.length} events');

	document = new rrdomNodejs.RRDocument();
	//document = new rrdom.RRDocument();

	////rrdoc.open();
	//console.log(document);

	document.addEventListener = () => {};

	document = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
		url: "http://localhost",
		//pretendToBeVisual: true,
	}).window.document.documentElement;
	console.log(document.innerHTML);

	//console.log(dom);
	//console.log(dom.documentElement);

	const replayer = new replay.Replayer(rrwebEvents, {
		root: document,
	});
	replayer.on(rrtypes.ReplayerEvents.Pause, (e) => {
		console.log('paused', e);
		//console.log(rrdoc.documentElement);
	});

	replayer.pause(0);

	console.log(printRRDom(replayer.iframe.contentDocument.documentElement));

	//console.log(document.documentElement.innerHTML);
	//console.log(replayer.iframe.contentDocument.documentElement);
	console.log('h');
	/*		  console.log(rrdoc.documentElement);

			  await fs.writeFile(`./test-outputX.html`, rrdoc.documentElement.textContent);
			  console.log('ok');
			  console.log(replayer.iframe);
			  console.log(replayer.iframe.contentDocument);
			  console.log(replayer.iframe.contentDocument.documentElement);
			  await fs.writeFile(`./test-output0.html`, replayer.iframe.contentDocument.documentElement.innerHTML);
			  replayer.pause(100000000000);
			  await fs.writeFile(`./test-output-end.html`, replayer.iframe.contentDocument.documentElement.innerHTML);
	*/
}

function printRRDom(rootNode) {
	return walk(rootNode);
}
function walk(node) {
	let printText = '';
	if (node.tagName) {
		printText = `<${node.toString()}`;
		printText += '>\n';
	}
	printText += node.textContent;
	//if(node instanceof rrdom.RRElement && node.shadowRoot)
	//	printText += walk(node.shadowRoot, mirror, ' ' + '  ');
	for (const child of node.childNodes) {
		console.log(child);
		printText += walk(child);
	}
	printText += `</${node.tagName}>`;
	//if (node instanceof rrdom.RRIFrameElement)
	//	printText += walk(node.contentDocument, mirror, ' ' + '  ');
	return printText;
}

await main();
console.log('done');
process.exit();
