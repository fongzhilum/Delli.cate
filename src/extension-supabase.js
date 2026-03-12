/**
 * extension-supabase.js
 *
 * Drop this file into your Chrome extension's src/ folder.
 * It gives the extension a single function to upsert distress data
 * directly into Supabase — no need to go through your React app.
 *
 * Usage in your extension's background/content script:
 *   import { upsertDistressPost } from './extension-supabase.js';
 *   await upsertDistressPost({ platform, username, content, distressScore, emotionalIntensity, isConcerning });
 */

const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';  // ← replace
const SUPABASE_KEY  = 'YOUR_ANON_KEY';                     // ← replace (anon key is fine)

const headers = {
  'Content-Type':  'application/json',
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer':        'return=representation',
};

/** Resolve a social_media_accounts row → case UUID */
async function findCaseByUsername(platform, username) {
  const url = `${SUPABASE_URL}/rest/v1/social_media_accounts`
    + `?platform=eq.${encodeURIComponent(platform)}`
    + `&username=eq.${encodeURIComponent(username)}`
    + `&select=case_id`;

  const res  = await fetch(url, { headers });
  const rows = await res.json();
  return rows[0]?.case_id ?? null;
}

/** Update the case's distress_score and risk_level */
async function updateCaseRisk(caseId, distressScore) {
  const riskLevel =
    distressScore >= 65 ? 'critical'
    : distressScore >= 45 ? 'high'
    : distressScore >= 25 ? 'medium'
    : 'low';

  await fetch(`${SUPABASE_URL}/rest/v1/cases?id=eq.${caseId}`, {
    method:  'PATCH',
    headers,
    body: JSON.stringify({ distress_score: distressScore, risk_level: riskLevel }),
  });
}

/**
 * Main function called by the extension after it analyses a post.
 *
 * @param {object} opts
 * @param {string} opts.platform          - 'instagram' | 'tiktok'
 * @param {string} opts.username          - social media handle (without @)
 * @param {string} opts.content           - post text
 * @param {number} opts.distressScore     - 0-100
 * @param {number} opts.emotionalIntensity - 0-100
 * @param {boolean} opts.isConcerning
 * @param {string} [opts.timestamp]       - ISO string, defaults to now
 */
export async function upsertDistressPost({
  platform,
  username,
  content,
  distressScore,
  emotionalIntensity,
  isConcerning,
  timestamp,
}) {
  const caseId = await findCaseByUsername(platform, username);
  if (!caseId) {
    console.warn(`[Delli.cate] No case found for ${platform}/@${username}`);
    return { ok: false, reason: 'no_case_found' };
  }

  // Insert the post
  const postRes = await fetch(`${SUPABASE_URL}/rest/v1/distress_posts`, {
    method:  'POST',
    headers,
    body: JSON.stringify({
      case_id:            caseId,
      platform,
      content,
      distress_score:     distressScore,
      emotional_intensity: emotionalIntensity,
      is_concerning:      isConcerning,
      timestamp:          timestamp ?? new Date().toISOString(),
    }),
  });

  if (!postRes.ok) {
    const err = await postRes.text();
    console.error('[Delli.cate] Failed to insert post:', err);
    return { ok: false, reason: err };
  }

  // Also bump the parent case's overall distress score if this post is worse
  if (isConcerning) {
    await updateCaseRisk(caseId, distressScore);
  }

  // Update last_checked on the social_media_accounts row
  await fetch(
    `${SUPABASE_URL}/rest/v1/social_media_accounts`
      + `?case_id=eq.${caseId}&platform=eq.${encodeURIComponent(platform)}`,
    {
      method:  'PATCH',
      headers,
      body: JSON.stringify({ last_checked: new Date().toISOString() }),
    }
  );

  return { ok: true, caseId };
}
