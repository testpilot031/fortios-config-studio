export interface FortiOSCommand {
    command: string;
    description: string;
    context: string[];
    parameters?: string[];
}

export const FORTIOS_COMMANDS: FortiOSCommand[] = [
    // Global system commands
    {
        command: "set hostname",
        description: "Set device hostname",
        context: ["config system global"],
        parameters: ["hostname"]
    },
    {
        command: "set timezone",
        description: "Set system timezone",
        context: ["config system global"],
        parameters: ["timezone"]
    },
    {
        command: "set admin-sport",
        description: "Set administrative access port",
        context: ["config system global"],
        parameters: ["port"]
    },

    // Interface configuration
    {
        command: "set mode",
        description: "Set interface mode",
        context: ["config system interface"],
        parameters: ["static", "dhcp", "pppoe"]
    },
    {
        command: "set ip",
        description: "Set interface IP address and netmask",
        context: ["config system interface"],
        parameters: ["ip", "netmask"]
    },
    {
        command: "set allowaccess",
        description: "Set allowed administrative access protocols",
        context: ["config system interface"],
        parameters: ["ping", "https", "ssh", "http", "telnet", "fgfm", "snmp", "ftm"]
    },

    // Firewall policy
    {
        command: "set srcintf",
        description: "Set source interface",
        context: ["config firewall policy"],
        parameters: ["interface"]
    },
    {
        command: "set dstintf",
        description: "Set destination interface",
        context: ["config firewall policy"],
        parameters: ["interface"]
    },
    {
        command: "set srcaddr",
        description: "Set source address object",
        context: ["config firewall policy"],
        parameters: ["address"]
    },
    {
        command: "set dstaddr",
        description: "Set destination address object",
        context: ["config firewall policy"],
        parameters: ["address"]
    },
    {
        command: "set action",
        description: "Set policy action",
        context: ["config firewall policy"],
        parameters: ["accept", "deny", "ipsec"]
    },
    {
        command: "set service",
        description: "Set service object",
        context: ["config firewall policy"],
        parameters: ["service"]
    },

    // Address objects
    {
        command: "set subnet",
        description: "Set subnet for address object",
        context: ["config firewall address"],
        parameters: ["subnet", "netmask"]
    },
    {
        command: "set type",
        description: "Set address object type",
        context: ["config firewall address"],
        parameters: ["ipmask", "iprange", "fqdn", "geography"]
    },

    // Service objects
    {
        command: "set protocol",
        description: "Set service protocol",
        context: ["config firewall service custom"],
        parameters: ["TCP/UDP/ICMP", "IP", "ALL"]
    },
    {
        command: "set tcp-portrange",
        description: "Set TCP port range",
        context: ["config firewall service custom"],
        parameters: ["port-range"]
    },
    {
        command: "set udp-portrange",
        description: "Set UDP port range",
        context: ["config firewall service custom"],
        parameters: ["port-range"]
    },

    // Router configuration
    {
        command: "set gateway",
        description: "Set gateway for static route",
        context: ["config router static"],
        parameters: ["gateway-ip"]
    },
    {
        command: "set device",
        description: "Set outgoing interface for route",
        context: ["config router static"],
        parameters: ["interface"]
    },
    {
        command: "set dst",
        description: "Set destination network for route",
        context: ["config router static"],
        parameters: ["network", "netmask"]
    },

    // VPN configuration
    {
        command: "set type",
        description: "Set VPN tunnel type",
        context: ["config vpn ipsec phase1-interface"],
        parameters: ["static", "dynamic", "ddns"]
    },
    {
        command: "set interface",
        description: "Set VPN interface",
        context: ["config vpn ipsec phase1-interface"],
        parameters: ["interface"]
    },
    {
        command: "set peertype",
        description: "Set peer type for VPN",
        context: ["config vpn ipsec phase1-interface"],
        parameters: ["any", "one", "dialup", "peer", "peergrp"]
    }
];

export const CONFIG_BLOCKS = [
    "config system global",
    "config system interface",
    "config system admin",
    "config system dns",
    "config system ntp",
    "config firewall policy",
    "config firewall address",
    "config firewall addrgrp",
    "config firewall service custom",
    "config firewall service group",
    "config firewall schedule onetime",
    "config firewall schedule recurring",
    "config router static",
    "config router policy",
    "config vpn ipsec phase1-interface",
    "config vpn ipsec phase2-interface",
    "config user local",
    "config user group",
    "config log setting",
    "config antivirus profile",
    "config webfilter profile",
    "config ips sensor"
];