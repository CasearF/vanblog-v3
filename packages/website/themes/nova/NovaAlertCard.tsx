import Dayjs from "dayjs";

export default function NovaAlertCard(props: {
  updatedAt: Date;
  createdAt: Date;
  showExpirationReminder?: boolean;
  expirationDays?: number;
}) {
  if (props.showExpirationReminder) {
    const dayjs = Dayjs();
    const diff = dayjs.diff(props.createdAt, "days");

    if (diff > (props.expirationDays || 30)) {
      return (
        <div className="nova-alert-card">
          <div className="nova-alert-icon">!</div>
          <div className="nova-alert-text">
            请注意，本文编写于 {diff} 天前，最后修改于{" "}
            {dayjs.diff(props.updatedAt, "days")} 天前，其中某些信息可能已经过时。
          </div>
        </div>
      );
    }
  }

  return null;
}
