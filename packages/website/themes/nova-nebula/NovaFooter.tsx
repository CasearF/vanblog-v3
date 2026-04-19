import Link from "next/link";

interface FooterProps {
  ipcNumber?: string;
  ipcHref?: string;
  since?: string;
  version?: string;
  gaBeianLogoUrl?: string;
  gaBeianNumber?: string;
  gaBeianUrl?: string;
}

export default function NovaFooter(props: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="nova-footer">
      <div className="nova-footer-inner">
        <div className="nova-footer-text">
          <p>
            © {currentYear} · Powered by{" "}
            <a
              href="https://vanblog.mereith.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              VanBlog
            </a>
          </p>
          {props.ipcNumber && (
            <p className="nova-mt-4">
              <a
                href={props.ipcHref || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                {props.ipcNumber}
              </a>
            </p>
          )}
          {props.gaBeianNumber && (
            <p className="nova-mt-2">
              <a
                href={props.gaBeianUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                {props.gaBeianNumber}
              </a>
            </p>
          )}
          {props.version && (
            <p className="nova-mt-2 nova-text-muted">v{props.version}</p>
          )}
        </div>
      </div>
    </footer>
  );
}
