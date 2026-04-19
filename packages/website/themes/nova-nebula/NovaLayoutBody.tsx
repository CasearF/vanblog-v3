interface LayoutBodyProps {
  children: React.ReactNode;
  sideBar?: React.ReactNode;
}

export default function NovaLayoutBody(props: LayoutBodyProps) {
  return (
    <div className="nova-container">
      <div className="nova-layout-body">
        <main className="nova-main-content">
          {props.children}
        </main>
        {props.sideBar && (
          <aside className="nova-sidebar">
            {props.sideBar}
          </aside>
        )}
      </div>
    </div>
  );
}
