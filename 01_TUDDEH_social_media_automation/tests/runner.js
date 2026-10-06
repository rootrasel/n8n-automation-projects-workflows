const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, '..', 'workflows');
const DATA_TABLES_DIR = path.join(__dirname, '..', 'n8n_data_tables');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function check(desc, condition) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ ${desc}`);
  } else {
    failedChecks++;
    console.error(`  ✗ FAIL: ${desc}`);
  }
}

console.log('====================================================');
console.log('   TUDDEH Social Automation — Automated Test Suite   ');
console.log('       (Consolidated 14-Workflow Architecture)      ');
console.log('====================================================\n');

// 1. Check all 14 consolidated workflow files exist
console.log('SECTION 1: Workflow Files Verification');
const expectedWorkflows = [
  'TUDDEH_Master_Pipeline.json',
  'WF-00_Business_Folder_Provisioning.json',
  'WF-01_Marketing_Queue_Trigger.json',
  'WF-02_Validate_Marketing_Job.json',
  'WF-03_Business_Listing_Media_Lookup.json',
  'WF-05_AI_Content_Decision_Copy.json',
  'WF-09_Save_Generated_Draft.json',
  'WF-11_Approval_Revision_Controller.json',
  'WF-12_Create_Approved_Package.json',
  'WF-13A_Schedule_Requested_Verification.json',
  'WF-13B_Publish_Confirmed_Verification.json',
  'WF-15_Daily_Ready_To_Schedule_Digest.json',
  'WF-98_Daily_Reconciliation.json',
  'WF-99_Global_Error_Handler.json'
];

for (const wfFile of expectedWorkflows) {
  const filePath = path.join(WORKFLOWS_DIR, wfFile);
  check(`File exists: ${wfFile}`, fs.existsSync(filePath));
}

// 2. Syntax & Structural Topology Validation
console.log('\nSECTION 2: JSON Syntax & Connection Topology');
const parsedWorkflows = {};

for (const wfFile of expectedWorkflows) {
  const filePath = path.join(WORKFLOWS_DIR, wfFile);
  if (!fs.existsSync(filePath)) continue;

  const raw = fs.readFileSync(filePath, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
    check(`${wfFile} is valid JSON`, true);
  } catch (e) {
    check(`${wfFile} is valid JSON: ${e.message}`, false);
    continue;
  }

  parsedWorkflows[wfFile] = json;
  const nodes = json.nodes || [];
  const nodeNames = new Set(nodes.map(n => n.name));

  check(`${wfFile} has nodes defined (${nodes.length} nodes)`, nodes.length > 0);

  // Check unique node IDs and valid 2D positions
  const ids = new Set();
  let posValid = true;
  for (const n of nodes) {
    if (ids.has(n.id)) {
      check(`${wfFile} duplicate node ID: ${n.id}`, false);
    }
    ids.add(n.id);
    if (!Array.isArray(n.position) || n.position.length !== 2) {
      posValid = false;
    }
  }
  check(`${wfFile} all node positions are standard 2-element arrays`, posValid);

  // Check connection integrity
  const conns = json.connections || {};
  let connValid = true;
  for (const [from, targetObj] of Object.entries(conns)) {
    if (!nodeNames.has(from)) {
      connValid = false;
      console.error(`    Connection origin "${from}" not found in nodes`);
    }
    for (const group of (targetObj.main || [])) {
      for (const target of group) {
        if (!nodeNames.has(target.node)) {
          connValid = false;
          console.error(`    Connection target "${target.node}" not found in nodes`);
        }
      }
    }
  }
  check(`${wfFile} connections map to valid existing nodes`, connValid);
}

// 3. Verification of JSON2Video Removal Across All Workflows
console.log('\nSECTION 3: Verification of JSON2Video Removal');
for (const wfFile of expectedWorkflows) {
  const filePath = path.join(WORKFLOWS_DIR, wfFile);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');

  check(`${wfFile} has NO JSON2video API references`, !/json2video/i.test(content));
}

// 4. Verification of Consolidated WF-05 (WF-04, 06, 07, 08 features preserved)
console.log('\nSECTION 4: Consolidated WF-05 Feature Verification');
const wf05 = parsedWorkflows['WF-05_AI_Content_Decision_Copy.json'];
if (wf05) {
  const nodeNames = (wf05.nodes || []).map(n => n.name);
  check('WF-05 includes Style Presets loading (from WF-04)', nodeNames.includes('Get All Style Presets'));
  check('WF-05 includes Style Preset resolution (from WF-04)', nodeNames.includes('Resolve Preset & Style Tokens'));
  check('WF-05 includes GPT-4o copy generation', nodeNames.includes('OpenAI Structured Content API'));
  check('WF-05 includes Anti-duplication check', nodeNames.includes('Parse & Semantic Anti-Dup Gate'));
  check('WF-05 includes Format router', nodeNames.includes('Route by Content Format'));
  check('WF-05 includes Direct Video handler (from WF-07)', nodeNames.includes('Process Reel Video Asset'));
  check('WF-05 includes Static Image DALL-E prompt & API (from WF-06)', nodeNames.includes('OpenAI Image API Request'));
  check('WF-05 includes Story & Carousel slides builder (from WF-08)', nodeNames.includes('Build Story & Carousel Slides'));
  check('WF-05 passes all formats to WF-09 Draft & Approval', nodeNames.includes('Pass to WF-09 Save Draft & Send Approval'));
}

// 5. Verification of Consolidated WF-09 (WF-09 & WF-10 features preserved)
console.log('\nSECTION 5: Consolidated WF-09 Feature Verification');
const wf09 = parsedWorkflows['WF-09_Save_Generated_Draft.json'];
if (wf09) {
  const nodeNames = (wf09.nodes || []).map(n => n.name);
  check('WF-09 includes Draft folder creation in Drive', nodeNames.includes('Create Job Draft Folder in Drive'));
  check('WF-09 includes Marketing Queue sheet update', nodeNames.includes('Update Sheet: Ready for Review'));
  check('WF-09 includes Single-use cryptographic approval token signing (from WF-10)', nodeNames.includes('Sign Action URLs & Build Email Template'));
  check('WF-09 includes Data table job state and token update', nodeNames.includes('Store Draft & Token in tuddeh_content_jobs'));
  check('WF-09 includes Gmail approval request dispatch (from WF-10)', nodeNames.includes('Send Approval Email (Gmail)'));
}

// 6. Verification of Google Sheets & Data Tables Configurations
console.log('\nSECTION 6: Google Sheets & Data Tables Parameter Integrity');
for (const [wfFile, wf] of Object.entries(parsedWorkflows)) {
  for (const n of wf.nodes || []) {
    if (n.type === 'n8n-nodes-base.googleSheets') {
      const p = n.parameters || {};
      const docVal = p.documentId ? p.documentId.value : '';
      check(`[${wfFile}] Google Sheets node "${n.name}" uses GOOGLE_SHEETS_TRACKER_ID env`, docVal.includes('$env.GOOGLE_SHEETS_TRACKER_ID'));
    }
    if (n.type === 'n8n-nodes-base.dataTable') {
      const p = n.parameters || {};
      if (p.columns && p.columns.mappingMode === 'defineBelow') {
        check(`[${wfFile}] Data Table node "${n.name}" uses "values" property`, !p.columns.value && (p.columns.values !== undefined));
      }
    }
  }
}

// 7. Data Tables Schemas Verification
console.log('\nSECTION 7: Data Tables CSV Schemas & Header Alignments');
const expectedDataTables = {
  'tuddeh_global_config.csv': ['config_key', 'config_value'],
  'tuddeh_business_registry.csv': ['business_id', 'root_drive_id', 'photos_folder_id', 'videos_folder_id', 'folder_url', 'provisioning_status'],
  'tuddeh_content_jobs.csv': ['internal_job_id', 'business_id', 'marketing_job', 'production_status', 'scheduling_status', 'approval_token', 'drive_draft_folder_id', 'drive_approved_folder_id', 'current_drive_location'],
  'tuddeh_style_presets.csv': ['preset_id', 'family', 'headline_color', 'accent_color', 'overlay_opacity'],
  'tuddeh_creative_history.csv': ['business_id', 'internal_job_id', 'hook', 'content_format', 'selected_assets'],
  'tuddeh_asset_usage.csv': ['asset_id', 'business_id', 'last_used_timestamp', 'usage_count'],
  'tuddeh_error_log.csv': ['error_id', 'timestamp', 'workflow', 'node', 'error_type', 'error_message']
};

for (const [dtFile, requiredCols] of Object.entries(expectedDataTables)) {
  const dtPath = path.join(DATA_TABLES_DIR, dtFile);
  const exists = fs.existsSync(dtPath);
  check(`Data Table schema exists: ${dtFile}`, exists);
  if (exists) {
    const firstLine = fs.readFileSync(dtPath, 'utf8').split('\n')[0].trim();
    const headers = firstLine.split(',').map(h => h.trim());
    for (const col of requiredCols) {
      check(`[${dtFile}] header contains required column "${col}"`, headers.includes(col));
    }
  }
}

// 8. Summary
console.log('\n====================================================');
console.log(`TOTAL CHECKS:  ${totalChecks}`);
console.log(`PASSED:        ${passedChecks}`);
console.log(`FAILED:        ${failedChecks}`);
console.log('====================================================\n');

if (failedChecks > 0) {
  console.error(`Tests finished with ${failedChecks} failure(s).`);
  process.exit(1);
} else {
  console.log('All 14 consolidated workflows passed all tests successfully!');
  process.exit(0);
}
