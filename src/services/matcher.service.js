const BANGLA_DIGITS = { '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9 };

const TRANSACTION_TYPE = {
  CASH_IN: 'cash_in',
  CASH_OUT: 'cash_out',
  MERCHANT_SETTLEMENT: 'merchant_settlement',
  REFUND: 'refund',
  TRANSFER: 'transfer',
  PAYMENT: 'payment',
};

const ENTITY_TYPE = {
  MERCHANT: 'merchant',
  AGENT: 'agent',
  CUSTOMER: 'customer',
};

const STATUS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  PENDING: 'pending',
  REVERSED: 'reversed',
  CANCELLED: 'cancelled',
};

const SCORE = {
  AMOUNT_EXACT: 40,
  AMOUNT_NEAR: 20,
  RECIPIENT_EXACT: 25,
  RECIPIENT_PARTIAL: 12,
  TYPE_EXACT: 15,
  TYPE_PARTIAL: 7,
  STATUS_MATCH: 10,
  TIME_MATCH: 10,
  KEYWORD_MATCH: 5,
  ENTITY_MATCH: 8,
  MISSING_TIMESTAMP_PENALTY: 5,
  MAX: 100,
};

const CONFIDENCE = {
  SCORE_WEIGHT: 0.5,
  SIGNAL_WEIGHT: 0.3,
  GAP_WEIGHT: 0.2,
  AMBIGUITY_PENALTY: 0.2,
  SIGNAL_DIVISOR: 5,
};

const AMBIGUITY_THRESHOLD = 10;

const TRANSACTION_TYPE_MAP = {
  [TRANSACTION_TYPE.TRANSFER]: [
    'transfer', 'send', 'sent', 'পাঠানো', 'পাঠিয়েছি', 'পাঠিয়েছেন',
    'ট্রান্সফার', 'transfer korechi', 'pathiyechi', 'send korechi',
  ],
  [TRANSACTION_TYPE.PAYMENT]: [
    'payment', 'pay', 'paid', 'পেমেন্ট', 'পরিশোধ',
    'payment korchi', 'payment korechi', 'pay korechi',
  ],
  [TRANSACTION_TYPE.CASH_IN]: [
    'cash in', 'cashin', 'ক্যাশ ইন', 'add money', 'deposit',
    'recharge', 'cash in korechi', 'add korechi',
  ],
  [TRANSACTION_TYPE.CASH_OUT]: [
    'cash out', 'cashout', 'ক্যাশ আউট', 'withdraw', 'withdrawal',
    'taka tulechi', 'cash out korechi', 'tulchi',
  ],
  [TRANSACTION_TYPE.REFUND]: [
    'refund', 'রিফান্ড', 'ফেরত', 'ফিরিয়ে', 'ferat', 'firiye',
    'refund korechi', 'money back',
  ],
  [TRANSACTION_TYPE.MERCHANT_SETTLEMENT]: [
    'merchant settlement', 'merchant payout', 'settlement', 'settled',
    'settlement delay', 'payout', 'settlement pending',
  ],
};

const NORMALIZED_TYPE_MAP = Object.entries(TRANSACTION_TYPE_MAP).reduce((acc, [type, keywords]) => {
  keywords.forEach(kw => { acc[kw] = type; });
  return acc;
}, {});

const TYPE_EXACT_KEYS = Object.values(TRANSACTION_TYPE).reduce((acc, v) => {
  acc[v] = v;
  acc[v.replace(/_/g, ' ')] = v;
  return acc;
}, {});

const ENTITY_TYPE_MAP = {
  [ENTITY_TYPE.MERCHANT]: [
    'merchant', 'shop', 'store', 'মার্চেন্ট', 'দোকান',
  ],
  [ENTITY_TYPE.AGENT]: [
    'agent', 'এজেন্ট', 'agent theke', 'agent diye',
  ],
};

const TIME_HINT_MAP = {
  today: ['today', 'আজ', 'aaj', 'aj', 'এখন', 'ekhon', 'just now', 'abhi'],
  yesterday: ['yesterday', 'গতকাল', 'gotokal', 'kal', 'কাল'],
  morning: ['morning', 'সকাল', 'shokal', 'sokale'],
  afternoon: ['afternoon', 'দুপুর', 'dupur', 'dupure'],
  evening: ['evening', 'সন্ধ্যা', 'shondha', 'shondhay'],
  night: ['night', 'রাত', 'rat', 'rate', 'রাতে'],
  'this week': ['this week', 'এই সপ্তাহ', 'ei shoptah', 'shoptahe', 'week e'],
  'last week': ['last week', 'গত সপ্তাহ', 'goto shoptah', 'last shoptah'],
  'this month': ['this month', 'এই মাসে', 'ei mase', 'ei month e'],
  'last month': ['last month', 'গত মাসে', 'goto mase', 'last month e'],
  monday: ['monday', 'সোমবার', 'shombar'],
  tuesday: ['tuesday', 'মঙ্গলবার', 'mongolbar'],
  wednesday: ['wednesday', 'বুধবার', 'budhbar'],
  thursday: ['thursday', 'বৃহস্পতিবার', 'brihoshpotibar'],
  friday: ['friday', 'শুক্রবার', 'shukrobar'],
  saturday: ['saturday', 'শনিবার', 'shonibar'],
  sunday: ['sunday', 'রবিবার', 'robibar'],
};

const RELATIVE_TIME_PATTERNS = [
  { pattern: /(\d+)\s*(hour|hr|ghanta|ঘণ্টা)\s*ago/i, unit: 'hours' },
  { pattern: /(\d+)\s*(minute|min|minit|মিনিট)\s*ago/i, unit: 'minutes' },
  { pattern: /(\d+)\s*(second|sec|শেকেন্ড)\s*ago/i, unit: 'seconds' },
];

const STATUS_KEYWORDS = {
  [STATUS.COMPLETED]: [
    'completed', 'complete', 'success', 'successful', 'done',
    'সফল', 'hoyeche', 'হয়েছে', 'সম্পন্ন', 'accepted',
  ],
  [STATUS.FAILED]: [
    'failed', 'fail', 'failure', 'ব্যর্থ', 'hoyni', 'হয়নি',
    'jay ni', 'jায়নি', 'unsuccessful', 'error', 'declined',
  ],
  [STATUS.PENDING]: [
    'pending', 'পেন্ডিং', 'abhi nai', 'wait', 'processing',
    'in progress', 'initiated', 'queued',
  ],
  [STATUS.REVERSED]: ['reversed', 'reverse', 'উল্টানো'],
  [STATUS.CANCELLED]: ['cancelled', 'canceled', 'cancel', 'বাতিল', 'batil'],
};

const PROBLEM_KEYWORDS_LIST = [
  'duplicate payment', 'wrong transfer', 'wrong number', 'money deducted',
  'payment failed', 'cash in', 'cash out', 'merchant settlement',
  'otp scam', 'duplicate', 'twice', 'double', 'refund',
  'otp', 'pin', 'password', 'fraud', 'phishing', 'scam', 'blocked',
  'payment', 'merchant', 'agent',
];

const STOP_WORDS = new Set([
  'i', 'a', 'the', 'is', 'it', 'in', 'on', 'at', 'to', 'of', 'and', 'or',
  'my', 'me', 'we', 'he', 'she', 'আমি', 'আমার', 'এটা', 'এই', 'ও', 'এবং',
  'করেছি', 'করলাম', 'করেছেন', 'করা', 'হয়েছে', 'হয়নি',
]);

const DAY_MAP = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
  friday: 5, saturday: 6, sunday: 0,
};

const convertBanglaDigits = (str) =>
  str.split('').map(ch => {
    const val = BANGLA_DIGITS[ch];
    return val !== undefined ? String(val) : ch;
  }).join('');

const normalizeBanglaText = (text) => convertBanglaDigits(text);

const tokenize = (text) => text.split(/\s+/).filter(t => t.length > 0);

const removePunctuation = (text) =>
  text.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~।]/g, ' ');

const preprocessComplaint = (complaint) => {
  if (!complaint || typeof complaint !== 'string') {
    return { normalizedComplaint: '', cleanedComplaint: '', tokens: [] };
  }

  const normalizedComplaint = normalizeBanglaText(complaint.toLowerCase().trim());
  const cleanedComplaint = removePunctuation(normalizedComplaint).replace(/\s+/g, ' ').trim();
  const tokens = tokenize(cleanedComplaint);

  return { normalizedComplaint, cleanedComplaint, tokens };
};

const extractAllAmounts = (text) => {
  const amounts = [];
  const cleaned = text.replace(/,(?=\d{3})/g, '');
  const matches = cleaned.match(/\d+(\.\d+)?/g);
  if (matches) {
    matches.forEach(m => {
      const val = parseFloat(m);
      if (val > 0) amounts.push(val);
    });
  }
  return amounts;
};

const normalizeBDPhone = (raw) => {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 13 && digits.startsWith('880')) return digits.slice(3);
  if (digits.length === 14 && digits.startsWith('8800')) return digits.slice(4);
  return digits;
};

const BD_PHONE_REGEX = /(?:\+?880|0)?1[3-9]\d{8}/g;

const RECIPIENT_PREFIXES = [
  'to ', 'send to ', 'sent to ', 'payment to ', 'transfer to ',
  'ke ', 'কে ', 'er kache ', 'এর কাছে ',
  'number ', 'no ', 'account ', 'wallet ', 'merchant id ', 'agent id ',
  'counterparty ', 'recipient ',
];

const extractRecipient = (text) => {
  const phoneMatch = text.match(BD_PHONE_REGEX);
  if (phoneMatch) return normalizeBDPhone(phoneMatch[0]);

  const maskedMatch = text.match(/\*+\d{4,}/);
  if (maskedMatch) return maskedMatch[0];

  const longNumMatch = text.match(/\d{10,}/);
  if (longNumMatch) return longNumMatch[0];

  for (const prefix of RECIPIENT_PREFIXES) {
    const idx = text.indexOf(prefix);
    if (idx !== -1) {
      const after = text.slice(idx + prefix.length).trim().split(/\s+/);
      if (after.length > 0 && after[0].length > 1) {
        return after[0].replace(/[^a-z0-9\u0980-\u09FF]/gi, '');
      }
    }
  }

  return null;
};

const extractTimeHint = (text) => {
  for (const { pattern, unit } of RELATIVE_TIME_PATTERNS) {
    const match = text.match(pattern);
    if (match) return { type: 'relative', value: parseInt(match[1], 10), unit };
  }

  const specificTime = text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i);
  if (specificTime) return { type: 'time', value: specificTime[0] };

  const specificDate = text.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (specificDate) return { type: 'date', value: specificDate[0] };

  for (const [hint, keywords] of Object.entries(TIME_HINT_MAP)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return { type: 'hint', value: hint };
    }
  }

  return null;
};

const extractTransactionType = (text) => {
  const sortedKeywords = Object.keys(NORMALIZED_TYPE_MAP).sort((a, b) => b.length - a.length);
  for (const kw of sortedKeywords) {
    if (text.includes(kw)) return NORMALIZED_TYPE_MAP[kw];
  }
  return null;
};

const extractEntityType = (text) => {
  for (const [entity, keywords] of Object.entries(ENTITY_TYPE_MAP)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return entity;
    }
  }
  return ENTITY_TYPE.CUSTOMER;
};

const tokenMatchesPhrase = (tokens, phrase) => {
  const parts = phrase.split(' ');
  if (parts.length === 1) return tokens.includes(parts[0]);
  const joined = tokens.join(' ');
  return joined.includes(phrase);
};

const extractKeywords = (tokens, amounts, recipient, transactionType) => {
  const amountSet = new Set(amounts.map(String));
  const typeTokens = new Set(transactionType ? transactionType.split(/[_\s]+/) : []);
  const text = tokens.join(' ');

  const filtered = tokens.filter(t => {
    if (t.length < 2) return false;
    if (STOP_WORDS.has(t)) return false;
    if (amountSet.has(t)) return false;
    if (recipient && t === recipient) return false;
    if (typeTokens.has(t)) return false;
    return true;
  });

  const problemMatches = PROBLEM_KEYWORDS_LIST.filter(kw =>
    kw.includes(' ') ? text.includes(kw) : filtered.includes(kw)
  );

  return [...new Set([...filtered, ...problemMatches])];
};

const extractStatusFromComplaint = (text) => {
  for (const [status, words] of Object.entries(STATUS_KEYWORDS)) {
    if (words.some(w => text.includes(w))) return status;
  }
  return null;
};

const extractSignals = (processedComplaint) => {
  const { cleanedComplaint, tokens } = processedComplaint;

  const amounts = extractAllAmounts(cleanedComplaint);
  const amount = amounts.length > 0 ? amounts[0] : null;
  const recipient = extractRecipient(cleanedComplaint);
  const timeHint = extractTimeHint(cleanedComplaint);
  const transactionType = extractTransactionType(cleanedComplaint);
  const entityType = extractEntityType(cleanedComplaint);
  const keywords = extractKeywords(tokens, amounts, recipient, transactionType);

  return { amount, amounts, recipient, timeHint, transactionType, entityType, keywords };
};

const cloneDate = (d) => new Date(d.getTime());

const getDateRangeForHint = (hint) => {
  if (!hint) return null;

  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const today = startOfDay(now);

  if (hint.type === 'relative') {
    const from = cloneDate(now);
    if (hint.unit === 'hours') from.setHours(from.getHours() - hint.value);
    else if (hint.unit === 'minutes') from.setMinutes(from.getMinutes() - hint.value);
    else if (hint.unit === 'seconds') from.setSeconds(from.getSeconds() - hint.value);
    return { from, to: cloneDate(now) };
  }

  if (hint.type !== 'hint') return null;

  const hintValue = hint.value;

  if (hintValue === 'today') return { from: cloneDate(today), to: endOfDay(now) };
  if (hintValue === 'yesterday') {
    const y = cloneDate(today);
    y.setDate(y.getDate() - 1);
    return { from: y, to: endOfDay(cloneDate(y)) };
  }
  if (hintValue === 'this week') {
    const start = cloneDate(today);
    start.setDate(start.getDate() - start.getDay());
    return { from: start, to: endOfDay(now) };
  }
  if (hintValue === 'last week') {
    const end = cloneDate(today);
    end.setDate(end.getDate() - end.getDay() - 1);
    const start = cloneDate(end);
    start.setDate(start.getDate() - 6);
    return { from: start, to: endOfDay(end) };
  }
  if (hintValue === 'this month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
  }
  if (hintValue === 'last month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: start, to: endOfDay(end) };
  }
  if (hintValue in DAY_MAP) {
    const targetDay = DAY_MAP[hintValue];
    const diff = (now.getDay() - targetDay + 7) % 7 || 7;
    const target = cloneDate(today);
    target.setDate(target.getDate() - diff);
    return { from: target, to: endOfDay(cloneDate(target)) };
  }

  const todayForTime = cloneDate(today);
  if (hintValue === 'morning') {
    const from = cloneDate(todayForTime); from.setHours(5, 0, 0, 0);
    const to = cloneDate(todayForTime); to.setHours(11, 59, 59, 999);
    return { from, to };
  }
  if (hintValue === 'afternoon') {
    const from = cloneDate(todayForTime); from.setHours(12, 0, 0, 0);
    const to = cloneDate(todayForTime); to.setHours(16, 59, 59, 999);
    return { from, to };
  }
  if (hintValue === 'evening') {
    const from = cloneDate(todayForTime); from.setHours(17, 0, 0, 0);
    const to = cloneDate(todayForTime); to.setHours(19, 59, 59, 999);
    return { from, to };
  }
  if (hintValue === 'night') {
    const from = cloneDate(todayForTime); from.setHours(20, 0, 0, 0);
    const to = cloneDate(todayForTime); to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  return null;
};

const normalizeType = (type) => {
  if (!type) return null;
  const t = type.toLowerCase().trim().replace(/[-\s]+/g, '_');
  if (TYPE_EXACT_KEYS[t]) return TYPE_EXACT_KEYS[t];
  const tSpaced = t.replace(/_/g, ' ');
  if (NORMALIZED_TYPE_MAP[tSpaced]) return NORMALIZED_TYPE_MAP[tSpaced];
  if (NORMALIZED_TYPE_MAP[t]) return NORMALIZED_TYPE_MAP[t];
  return null;
};

const normalizeStatus = (rawStatus) => {
  if (!rawStatus) return null;
  const st = rawStatus.toLowerCase().trim();
  for (const [key, words] of Object.entries(STATUS_KEYWORDS)) {
    if (words.some(w => st === w || st.includes(w))) return key;
  }
  return null;
};

const normalizeTransaction = (tx) => {
  if (!tx || typeof tx !== 'object') return null;
  return {
    id: tx.id || tx._id || tx.transaction_id || tx.txn_id || tx.txnId || tx.reference || tx.referenceId || null,
    amount: tx.amount != null ? parseFloat(tx.amount) : null,
    recipientName: tx.recipientName || tx.receiver_name || tx.toName || tx.recipient_name || tx.receiver || null,
    recipientNumber: tx.recipientNumber || tx.receiverNumber || tx.recipient_number || tx.toNumber || tx.to || null,
    counterparty: tx.counterparty || null,
    transactionType: normalizeType(tx.transactionType || tx.type || null),
    status: normalizeStatus(tx.status || null),
    timestamp: tx.timestamp || tx.createdAt || tx.created_at || null,
    raw: tx,
  };
};

const filterImpossibleTransactions = (transactions) =>
  transactions.filter(tx => {
    if (!tx || typeof tx !== 'object') return false;
    if (tx.amount == null || isNaN(tx.amount) || tx.amount < 0) return false;
    if (!tx.transactionType) return false;
    return true;
  });

const diceSimilarity = (a, b) => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const getBigrams = (s) => {
    const bigrams = new Set();
    for (let i = 0; i < s.length - 1; i++) bigrams.add(s[i] + s[i + 1]);
    return bigrams;
  };
  const aBigrams = getBigrams(a);
  const bBigrams = getBigrams(b);
  let intersection = 0;
  for (const bg of aBigrams) { if (bBigrams.has(bg)) intersection++; }
  return (2 * intersection) / (aBigrams.size + bBigrams.size);
};

const RECIPIENT_SIMILARITY_THRESHOLD = 0.6;

const buildRecipientFields = (normalizedTx) =>
  [
    normalizedTx.recipientName,
    normalizedTx.recipientNumber,
    normalizedTx.counterparty,
  ].filter(Boolean).map(f => String(f).toLowerCase());

const matchRecipient = (signalRecipient, txFields) => {
  const rn = signalRecipient.toLowerCase();
  const normalizedSignal = BD_PHONE_REGEX.test(rn) ? normalizeBDPhone(rn) : rn;

  for (const f of txFields) {
    const normalizedField = BD_PHONE_REGEX.test(f) ? normalizeBDPhone(f) : f;
    if (normalizedField === normalizedSignal) return SCORE.RECIPIENT_EXACT;
    if (normalizedField.includes(normalizedSignal) || normalizedSignal.includes(normalizedField)) return SCORE.RECIPIENT_EXACT;
    if (diceSimilarity(normalizedField, normalizedSignal) >= RECIPIENT_SIMILARITY_THRESHOLD) return SCORE.RECIPIENT_PARTIAL;
  }
  return 0;
};

const scoreTransaction = (normalizedTx, signals, processedComplaint) => {
  if (!normalizedTx) return { score: 0, matchedSignals: 0 };

  let score = 0;
  let matchedSignals = 0;
  const text = processedComplaint.cleanedComplaint;
  const tokens = processedComplaint.tokens;

  if (signals.amounts && signals.amounts.length > 0 && normalizedTx.amount != null) {
    const txAmount = normalizedTx.amount;
    const amountSet = signals.amounts;
    const exactMatch = amountSet.some(a => a === txAmount);
    const nearMatch = !exactMatch && amountSet.some(a =>
      Math.abs(txAmount - a) / Math.max(txAmount, a) < 0.05
    );
    if (exactMatch) { score += SCORE.AMOUNT_EXACT; matchedSignals++; }
    else if (nearMatch) { score += SCORE.AMOUNT_NEAR; matchedSignals++; }
  }

  if (signals.recipient) {
    const txFields = buildRecipientFields(normalizedTx);
    const recipientScore = matchRecipient(signals.recipient, txFields);
    if (recipientScore > 0) { score += recipientScore; matchedSignals++; }
  }

  if (signals.transactionType && normalizedTx.transactionType) {
    const signalType = normalizeType(signals.transactionType);
    if (normalizedTx.transactionType === signalType) {
      score += SCORE.TYPE_EXACT;
      matchedSignals++;
    } else if (signalType && normalizedTx.transactionType && (
      normalizedTx.transactionType.includes(signalType) || signalType.includes(normalizedTx.transactionType)
    )) {
      score += SCORE.TYPE_PARTIAL;
      matchedSignals++;
    }
  }

  const complaintStatus = extractStatusFromComplaint(text);
  if (complaintStatus && normalizedTx.status && normalizedTx.status === complaintStatus) {
    score += SCORE.STATUS_MATCH;
    matchedSignals++;
  }

  if (signals.timeHint && normalizedTx.timestamp) {
    const range = getDateRangeForHint(signals.timeHint);
    if (range) {
      const txDate = new Date(normalizedTx.timestamp);
      if (!isNaN(txDate.getTime()) && txDate >= range.from && txDate <= range.to) {
        score += SCORE.TIME_MATCH;
        matchedSignals++;
      }
    }
  } else if (signals.timeHint && !normalizedTx.timestamp) {
    score = Math.max(0, score - SCORE.MISSING_TIMESTAMP_PENALTY);
  }

  if (signals.keywords && signals.keywords.length > 0) {
    const keywordHits = signals.keywords.filter(kw =>
      kw.includes(' ') ? tokenMatchesPhrase(tokens, kw) : tokens.includes(kw)
    ).length;
    if (keywordHits > 0) {
      score += Math.min(SCORE.KEYWORD_MATCH * keywordHits, SCORE.KEYWORD_MATCH * 2);
      matchedSignals++;
    }
  }

  if (signals.entityType && signals.entityType !== ENTITY_TYPE.CUSTOMER) {
    const txEntityFields = buildRecipientFields(normalizedTx);
    const entityKeywords = ENTITY_TYPE_MAP[signals.entityType] || [];
    if (txEntityFields.some(f => entityKeywords.some(kw => f.includes(kw)))) {
      score += SCORE.ENTITY_MATCH;
      matchedSignals++;
    }
  }

  return { score: Math.min(score, SCORE.MAX), matchedSignals };
};

const TIEBREAK_FIELDS = [
  { key: 'amount', signalKey: 'amounts', check: (tx, sig) => sig && sig.some(a => a === tx.amount) },
  { key: 'recipientNumber', signalKey: 'recipient', check: (tx, sig) => sig && tx.recipientNumber && tx.recipientNumber.includes(sig) },
  { key: 'transactionType', signalKey: 'transactionType', check: (tx, sig) => sig && tx.transactionType === normalizeType(sig) },
  { key: 'status', signalKey: 'status', check: (tx) => tx.status != null },
  { key: 'timestamp', signalKey: null, check: (tx) => tx.timestamp != null },
  { key: 'keywords', signalKey: 'keywords', check: (tx, sig, text) => sig && sig.some(kw => text && text.includes(kw)) },
];

const tieBreak = (a, b, signals, text) => {
  for (const field of TIEBREAK_FIELDS) {
    const sigVal = signals[field.signalKey] || null;
    const aMatch = field.check(a.transaction, sigVal, text) ? 1 : 0;
    const bMatch = field.check(b.transaction, sigVal, text) ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
  }
  return 0;
};

const rankTransactions = (transactions, signals, processedComplaint) => {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  const text = processedComplaint.cleanedComplaint;

  return transactions
    .map(tx => {
      const { score, matchedSignals } = scoreTransaction(tx, signals, processedComplaint);
      return { transaction: tx, score, matchedSignals };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return tieBreak(a, b, signals, text);
    });
};

const calculateConfidence = (ranked) => {
  if (!ranked || ranked.length === 0) return 0;

  const top = ranked[0];
  const second = ranked[1];
  const gap = second ? (top.score - second.score) / SCORE.MAX : 1;
  const signalWeight = Math.min(top.matchedSignals / CONFIDENCE.SIGNAL_DIVISOR, 1);
  const normalizedScore = top.score / SCORE.MAX;
  const ambiguityPenalty = gap < AMBIGUITY_THRESHOLD / SCORE.MAX ? CONFIDENCE.AMBIGUITY_PENALTY : 0;

  return Math.max(0, Math.min(1,
    (normalizedScore * CONFIDENCE.SCORE_WEIGHT +
      signalWeight * CONFIDENCE.SIGNAL_WEIGHT +
      gap * CONFIDENCE.GAP_WEIGHT) - ambiguityPenalty
  ));
};

const resolveAmbiguousMatches = (ranked) => {
  if (!ranked || ranked.length === 0) {
    return { ambiguous: false, bestTransaction: null, score: 0, confidence: 0 };
  }

  const topScore = ranked[0].score;
  const secondScore = ranked[1]?.score ?? -1;
  const isAmbiguous = secondScore !== -1 && (topScore - secondScore) <= AMBIGUITY_THRESHOLD;

  const confidence = calculateConfidence(ranked);

  if (isAmbiguous) {
    return { ambiguous: true, bestTransaction: null, score: topScore, confidence };
  }

  return { ambiguous: false, bestTransaction: ranked[0].transaction, score: topScore, confidence };
};

const findBestTransaction = (transactions, signals, processedComplaint) => {
  const ranked = rankTransactions(transactions, signals, processedComplaint);
  const { ambiguous, bestTransaction, score, confidence } = resolveAmbiguousMatches(ranked);

  return { relevantTransaction: bestTransaction, confidence, ambiguous, score };
};

const matcherService = (complaint, transactionHistory) => {
  const processedComplaint = preprocessComplaint(complaint);
  const signals = extractSignals(processedComplaint);

  const rawHistory = Array.isArray(transactionHistory) ? transactionHistory : [];
  const normalizedHistory = rawHistory.map(normalizeTransaction).filter(Boolean);
  const validHistory = filterImpossibleTransactions(normalizedHistory);

  const { relevantTransaction, confidence, ambiguous, score } = findBestTransaction(
    validHistory,
    signals,
    processedComplaint
  );

  return {
    relevantTransaction: relevantTransaction?.raw ?? relevantTransaction,
    confidence,
    ambiguous,
    processedComplaint,
    signals,
  };
};

export default matcherService;