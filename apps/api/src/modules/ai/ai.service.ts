export interface TicketTriageInput {
  title: string;
  description: string;
  category?: string;
  priority?: string;
  linkedAssetTag?: string;
  linkedAssetName?: string;
  requesterName?: string;
}

export interface TicketTriageResult {
  suggestedCategory: string;
  suggestedPriority: string;
  urgencyScore: number; // 1 to 10
  estimatedResolutionMinutes: number;
  rootCauseHypotheses: string[];
  diagnosticPlaybook: { step: number; action: string; expectedOutcome: string }[];
  draftResponse: string;
  preventiveAdvice: string;
}

export class AiService {
  static async triageTicket(input: TicketTriageInput): Promise<TicketTriageResult> {
    const text = `${input.title} ${input.description}`.toLowerCase();

    let suggestedCategory = input.category || 'HARDWARE';
    let suggestedPriority = input.priority || 'MEDIUM';
    let urgencyScore = 5;
    let estimatedMinutes = 60;
    let rootCauseHypotheses: string[] = [];
    let diagnosticPlaybook: { step: number; action: string; expectedOutcome: string }[] = [];
    let draftResponse = '';
    let preventiveAdvice = '';

    // Exit Clearance & Hardware Recovery for Full & Final Settlement
    if (text.includes('exit clearance') || text.includes('recover') || text.includes('noc') || text.includes('resigned') || text.includes('offboarding')) {
      suggestedCategory = 'ITAM_OFFBOARDING';
      suggestedPriority = 'HIGH';
      urgencyScore = 8;
      estimatedMinutes = 45;
      rootCauseHypotheses = [
        'Employee resignation logged in HRMS; mandatory IT asset recovery gate activated',
        'Company computing hardware & peripherals currently in employee custody pending physical return',
        'Electronic IT NOC locked until zero outstanding asset liabilities are recorded in ITAM',
      ];
      diagnosticPlaybook = [
        { step: 1, action: 'Inspect physical asset tag & serial number on returned hardware against ITAM custody receipt', expectedOutcome: 'Physical barcode AST tag verified' },
        { step: 2, action: 'Conduct hardware inspection (screen integrity, keyboard, OEM power adapter, ports)', expectedOutcome: 'Device condition graded A/B/C in inventory' },
        { step: 3, action: 'Execute "Return Asset" check-in in ITAM console to automatically issue cryptographic IT NOC', expectedOutcome: 'IT NOC auto-issued and F&F payroll release unlocked for HR' },
      ];
      draftResponse = `Hello ${input.requesterName || 'Employee'},\n\nWe have scheduled your IT asset return verification session. Please bring your assigned laptop, monitor, charger, and any corporate access tokens to the IT Helpdesk at your office. Once inspected and checked into ITAM, your electronic IT NOC will be automatically generated and transmitted to HR for Full & Final (F&F) settlement.\n\nBest regards,\nIT Asset Operations`;
      preventiveAdvice = 'Always require physical asset barcode scan before issuing final IT clearance.';
    }
    // New Hire Auto-Provisioning & Workstation Setup
    else if (text.includes('auto-provision') || text.includes('provision') || text.includes('onboarding') || text.includes('new joiner') || text.includes('bundle')) {
      suggestedCategory = 'PROVISIONING';
      suggestedPriority = 'HIGH';
      urgencyScore = 7;
      estimatedMinutes = 60;
      rootCauseHypotheses = [
        'New joiner onboarded via HR directory trigger with hardware auto-provisioning enabled',
        'Standard workstation hardware bundle (laptop, monitor, accessories) pending inventory allocation',
        'Enterprise MDM configuration, disk encryption, and corporate credentials require deployment',
      ];
      diagnosticPlaybook = [
        { step: 1, action: 'Select an in-stock laptop and monitor from ITAM inventory and assign to employee ID', expectedOutcome: 'In-app digital custody receipt generated (PENDING_ACKNOWLEDGEMENT)' },
        { step: 2, action: 'Enroll device into corporate MDM profile with disk encryption (FileVault / BitLocker)', expectedOutcome: 'Security baseline verified' },
        { step: 3, action: 'Deliver hardware bundle to employee and request digital signature via ESS portal', expectedOutcome: 'Employee signs digital custody acknowledgement' },
      ];
      draftResponse = `Welcome to the team, ${input.requesterName || 'there'}!\n\nYour enterprise IT hardware bundle is currently being prepared by our IT Workplace team. You will receive your pre-configured workstation and login credentials on your joining day. Once received, please log into your Employee Self-Service (ESS) portal to verify and sign the digital custody agreement.\n\nWarm regards,\nIT Workplace Technology Team`;
      preventiveAdvice = 'Maintain a minimum safety buffer of 5 pre-imaged laptops in stock for zero-delay onboarding.';
    }
    // Database / Server / Critical Outages
    else if (text.includes('database') || text.includes('pool') || text.includes('server') || text.includes('outage') || text.includes('down') || text.includes('prod')) {
      suggestedCategory = 'INFRASTRUCTURE';
      suggestedPriority = 'CRITICAL';
      urgencyScore = 9;
      estimatedMinutes = 30;
      rootCauseHypotheses = [
        'Connection leak in unclosed client connections / ORM pool exhaustion',
        'Database max_connections limit saturated by background ETL batch jobs',
        'Deadlock or high contention on primary cluster node',
      ];
      diagnosticPlaybook = [
        { step: 1, action: 'Execute `pg_stat_activity` or connection pool telemetry dump', expectedOutcome: 'Identify idle-in-transaction connections' },
        { step: 2, action: 'Restart replica pools or scale connection pooler (e.g. PgBouncer)', expectedOutcome: 'Immediate reduction in wait queue' },
        { step: 3, action: 'Audit recent microservice deployments for leaked connection transactions', expectedOutcome: 'Permanent bug fix applied' },
      ];
      draftResponse = `Hello ${input.requesterName || 'Team'},\n\nOur IT Infrastructure On-Call team has detected this critical database bottleneck and is currently draining stalled connections from the pooler. Services should stabilize within 15-20 minutes. We are monitoring latency in real-time.\n\nBest regards,\nIT Infrastructure NOC`;
      preventiveAdvice = 'Configure aggressive idle connection timeouts (30s) and set up alerting at 80% pool utilization.';
    }
    // Network / VPN Outage
    else if (text.includes('vpn') || text.includes('wifi') || text.includes('network') || text.includes('internet') || text.includes('dns')) {
      suggestedCategory = 'NETWORK';
      suggestedPriority = 'HIGH';
      urgencyScore = 7;
      estimatedMinutes = 45;
      rootCauseHypotheses = [
        'WireGuard / OpenVPN gateway certificate expiration or subnet collision',
        'Local DNS resolver timeout or corporate gateway routing loop',
        '802.1X RADIUS authentication certificate failure on client device',
      ];
      diagnosticPlaybook = [
        { step: 1, action: 'Verify VPN server load and client certificate validity', expectedOutcome: 'Server status confirmed operational' },
        { step: 2, action: 'Request employee flush DNS cache (`ipconfig /flushdns`) and reconnect', expectedOutcome: 'Route restored' },
        { step: 3, action: 'Verify corporate split-tunneling routing table', expectedOutcome: 'Corporate subnets reachable' },
      ];
      draftResponse = `Hi ${input.requesterName || 'there'},\n\nWe are reviewing your VPN connection issue. Please try disconnecting from the corporate VPN, running 'ipconfig /flushdns' in terminal/command prompt, and reconnecting to the secondary gateway (vpn-secondary.acme.com). If the issue persists, our technician will initiate a remote diagnostic session.\n\nRegards,\nIT Service Desk`;
      preventiveAdvice = 'Deploy automated certificate renewal via MDM profile 14 days before expiration.';
    }
    // Laptop / Hardware / Screen / Battery / Physical defects
    else if (text.includes('battery') || text.includes('screen') || text.includes('laptop') || text.includes('boot') || text.includes('keyboard') || text.includes('charging') || text.includes('hardware')) {
      suggestedCategory = 'HARDWARE';
      suggestedPriority = text.includes('boot') || text.includes('dead') ? 'HIGH' : 'MEDIUM';
      urgencyScore = 6;
      estimatedMinutes = 120;
      rootCauseHypotheses = [
        'Hardware component failure (motherboard power rail or battery wear cycle > 80%)',
        'Thermal throttling or dust accumulation in cooling exhaust',
        'USB-C PD charging controller malfunction or damaged power adapter',
      ];
      diagnosticPlaybook = [
        { step: 1, action: 'Perform SMC / NVRAM reset or hardware diagnostics cycle (Hold D on Apple Silicon / F12 on Dell)', expectedOutcome: 'Diagnostic error code generated' },
        { step: 2, action: 'Test device with certified OEM high-wattage power adapter', expectedOutcome: 'Check charging current' },
        { step: 3, action: 'Check device warranty status in ITAM inventory and issue standby laptop if repair exceeds 24h', expectedOutcome: 'Zero employee downtime' },
      ];
      draftResponse = `Hi ${input.requesterName || 'there'},\n\nThanks for reporting this hardware issue with ${input.linkedAssetName || 'your assigned device'}. Please bring the machine to the IT Bay at your office location for rapid diagnosis. If hardware replacement is required, we have standby inventory ready to allocate immediately.\n\nWarm regards,\nIT Asset Operations`;
      preventiveAdvice = 'Schedule annual battery cycle count audits during physical inventory checks.';
    }
    // Access / Credentials / Permissions
    else if (text.includes('access') || text.includes('password') || text.includes('login') || text.includes('permission') || text.includes('github') || text.includes('jira') || text.includes('slack')) {
      suggestedCategory = 'ACCESS_SECURITY';
      suggestedPriority = 'MEDIUM';
      urgencyScore = 5;
      estimatedMinutes = 20;
      rootCauseHypotheses = [
        'Role-Based Access Control (RBAC) group membership not synced from HR directory',
        'MFA token out of sync or expired SSO session token',
        'Privileged security group requires Manager approval before provisioning',
      ];
      diagnosticPlaybook = [
        { step: 1, action: 'Check employee department and designation in HR master records', expectedOutcome: 'Verify authorization eligibility' },
        { step: 2, action: 'Inspect Identity Provider (IdP) group assignments', expectedOutcome: 'Ensure security group mapped' },
        { step: 3, action: 'Trigger SCIM directory sync or issue temporary token', expectedOutcome: 'Access unlocked' },
      ];
      draftResponse = `Hi ${input.requesterName || 'there'},\n\nWe have received your access request. We have initiated automated permission provisioning for your role in accordance with corporate security policies. Please allow up to 15 minutes for the access token to propagate across all SSO services.\n\nBest regards,\nIT Identity & Access Team`;
      preventiveAdvice = 'Ensure onboarding auto-provisioning bundles are maintained for each designation.';
    }
    // General / Software
    else {
      suggestedCategory = 'SOFTWARE';
      suggestedPriority = 'LOW';
      urgencyScore = 4;
      estimatedMinutes = 60;
      rootCauseHypotheses = [
        'Software version incompatibility or missing prerequisite runtime',
        'Corrupted application local preferences cache',
      ];
      diagnosticPlaybook = [
        { step: 1, action: 'Review application logs and system crash reports', expectedOutcome: 'Locate exception stack trace' },
        { step: 2, action: 'Clear local app cache or reinstall via corporate self-service portal', expectedOutcome: 'Clean state achieved' },
      ];
      draftResponse = `Hello ${input.requesterName || 'there'},\n\nThank you for reaching out to the IT Helpdesk. An IT specialist has been assigned to your ticket and will assist you shortly. If possible, please attach a screenshot of any error dialog you are experiencing.\n\nBest regards,\nIT Service Desk`;
      preventiveAdvice = 'Push standardized software updates through MDM silent packaging.';
    }

    return {
      suggestedCategory,
      suggestedPriority,
      urgencyScore,
      estimatedResolutionMinutes: estimatedMinutes,
      rootCauseHypotheses,
      diagnosticPlaybook,
      draftResponse,
      preventiveAdvice,
    };
  }
}
