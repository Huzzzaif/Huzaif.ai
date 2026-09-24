'use strict';

// Public, reviewed portfolio facts. Content is independent of any AI provider.
// This prototype selects curated answers locally; it does not perform inference.
window.PORTFOLIO_KNOWLEDGE = [
  {
    id: 'intro',
    title: 'Software engineering, with depth in AI.',
    match: ['quick introduction', 'about huzaif', 'who is huzaif', 'who are you', 'tell me about yourself', 'tell me about huzaif', 'overview', 'introduce', 'summary', '60 second', 'background'],
    text: 'Huzaif Khan is a software and AI engineer with 4+ years across industry and research. At Capgemini, he helped rebuild an enterprise application serving 3,000+ daily users. His AI work includes SenseCLLM, an on-device privacy pipeline, and DataHub Steward, agents that investigate data dependencies and reuse findings.',
    links: [{label:'Start with SenseCLLM',href:'sensecllm.html'}, {label:'Explore his background',href:'about.html'}],
    sources: [{label:'Resume',href:'huzaif-khan-resume.pdf'}]
  },
  {
    id: 'sense',
    title: 'Reuse patterns. Avoid repeated model work.',
    match: ['sensecllm', 'sense cllm', 'sencellm', 'pii', '10.5', 'on device', 'privacy', 'regex', 'pattern memory', 'faster detection'],
    text: 'SenseCLLM caches LLM-generated regex patterns in adaptive memory. Repeated inputs can reuse those patterns, reducing the need for model inference. In the reported evaluation, mean latency fell from 1,960 ms at startup to 187 ms after 500 samples, with a 0.78 cache hit rate. That is the 10.5× comparison—not a comparison against a cloud service. The system uses three cooperating agents for detection, pattern learning and protection, and output validation.',
    links: [{label:'Read the SenseCLLM case study',href:'sensecllm.html'}, {label:'Explore the implementation',href:'https://github.com/Huzzzaif/sensecllm_edge'}],
    sources: [{label:'Project documentation',href:'https://github.com/Huzzzaif/sensecllm_edge#key-results'},{label:'IEEE publication',href:'https://ieeexplore.ieee.org/document/11569596'}]
  },
  {
    id: 'backend',
    title: 'Production performance, from APIs to data.',
    match: ['backend', 'back end', 'api', 'enterprise', 'capgemini', 'production', 'database', 'sql', 'scalab', 'reliab', 'performance', 'full stack', '91%', '3000', '3,000'],
    text: 'At Capgemini, Huzaif led the rebuild of a cross-platform time-tracking app used by 3,000+ people daily. Caching, asynchronous processing, and batched writes reduced clock-in response time from 2 seconds to 180 ms. Composite indexes and pagination improved average API response time by 64% under peak load. His DataHub Steward work adds FastAPI streaming and a GraphQL read/write integration.',
    links: [{label:'Read the production experience',href:'about.html#experience'}, {label:'Explore DataHub Steward',href:'steward.html'}],
    sources: [{label:'Resume',href:'huzaif-khan-resume.pdf'}]
  },
  {
    id: 'steward',
    title: 'An agent investigation that leaves evidence behind.',
    match: ['steward', 'datahub', 'lineage', 'token', 'root cause', 'blast radius', 'agents'],
    text: 'DataHub Steward uses agents to trace downstream impact and upstream root causes. They persist findings back into the catalog so subsequent investigations can reuse the evidence. A documented repeat-query benchmark reduced tokens from 571 to 281 and entity inspections from 30 to 18. Those are specific historical results; the hosted demo uses an in-memory catalog.',
    links: [{label:'Read the Steward case study',href:'steward.html'},{label:'Try the project demo',href:'https://huzzzaif.github.io/datahub-steward/'}],
    sources: [{label:'Benchmark documentation',href:'https://github.com/Huzzzaif/datahub-steward#benchmark-context'}]
  },
  {
    id: 'nlp',
    title: 'A held-out evaluation of clinical text classification.',
    match: ['medical', 'cancer', 'pathology', 'biobert', 'svm', 'nlp', 'classification', '94.5'],
    text: 'Huzaif’s medical text pipeline uses word- and character-level TF-IDF features with a Linear SVM and clinical-term masking. It achieved 94.5% accuracy and 0.943 macro F1 across 32 cancer types on 1,905 held-out reports. The BioBERT extension is separate; an independent test evaluation for it remains pending.',
    links: [{label:'Read the classification case study',href:'medical-nlp.html'}],
    sources: [{label:'Evaluation documentation',href:'https://github.com/Huzzzaif/nlp-cancer-prediction#results'}]
  },
  {
    id: 'research',
    title: 'Research that supports the engineering.',
    match: ['research', 'publication', 'papers', 'federated', 'encryption', 'ieee', 'journal'],
    text: 'Huzaif’s resume lists 6+ published papers across edge AI and ML. His work includes SenseCLLM, privacy-preserving federated learning, edge-assisted CKKS encryption, and in-network aggregation. He completed an M.S. in Computer Science at California State University, Dominguez Hills.',
    links: [{label:'Browse Google Scholar',href:'https://scholar.google.com/citations?user=M0gjnP4AAAAJ'},{label:'Read his background',href:'about.html'}],
    sources: [{label:'Resume',href:'huzaif-khan-resume.pdf'},{label:'Scholar',href:'https://scholar.google.com/citations?user=M0gjnP4AAAAJ'}]
  },
  {
    id: 'contact',
    title: 'Get in touch with Huzaif.',
    match: ['contact', 'email', 'hire', 'hiring', 'availability', 'available', 'opportunities', 'resume', 'cv', 'location', 'based'],
    text: 'Huzaif is based in Los Angeles and is interested in software engineering and AI engineering opportunities. You can read his resume or contact him directly for role details and availability.',
    links: [{label:'View the resume',href:'huzaif-khan-resume.pdf'},{label:'Email Huzaif',href:'mailto:huzaiffkhhan@gmail.com'}],
    sources: [{label:'Resume',href:'huzaif-khan-resume.pdf'}]
  },
  {
    id: 'education',
    title: 'Computer science at CSUDH.',
    match: ['education', 'degree', 'masters', 'master', 'gpa', 'university', 'study', 'studied'],
    text: 'Huzaif earned an M.S. in Computer Science at California State University, Dominguez Hills, from August 2023 to May 2025, with a 3.95 / 4.0 GPA.',
    links: [{label:'Read his background',href:'about.html'}],
    sources: [{label:'Resume',href:'huzaif-khan-resume.pdf'}]
  },
  {
    id: 'immersive',
    title: 'Additional experience in real-time systems.',
    match: ['vr', 'xr', 'unity', 'immersive', 'quest', 'headset', 'classroom', 'voice'],
    text: 'At CSUDH, Huzaif scaled a Unity VR classroom from 5 to 50 concurrent Meta Quest headsets at 72 FPS. He reduced per-client bandwidth by 88% and AI time to first response from 3.6 seconds to approximately 350 ms through FastAPI streaming. This complements his primary software and AI engineering work.',
    links: [{label:'Explore additional experience',href:'about.html#experience'}],
    sources: [{label:'Resume',href:'huzaif-khan-resume.pdf'}]
  }
];
