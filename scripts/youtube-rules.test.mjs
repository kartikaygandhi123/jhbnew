import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHANNEL_HANDLE, REFRESH_HOURS, chooseBroadcast, mergeVideos } from './youtube-rules.mjs';
test('uses requested news channel', () => assert.equal(CHANNEL_HANDLE, '@JaiHindBharatNews'));
test('refreshes twice per day', () => assert.equal(24 / REFRESH_HOURS, 2));
test('prefers detected live stream', () => assert.equal(chooseBroadcast([{youtube_id:'latest'}], {id:{videoId:'live'},snippet:{title:'Now'}}).youtube_id, 'live'));
test('falls back to latest video when offline', () => assert.deepEqual(chooseBroadcast([{youtube_id:'latest',title:'News'}], null), {youtube_id:'latest',is_live:false,title:'News'}));
test('keeps manual videos without duplicate automatic entries', () => assert.equal(mergeVideos([{youtube_id:'one'}], [{youtube_id:'one'},{youtube_id:'two'}]).length, 2));