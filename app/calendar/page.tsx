import { BatchCalendarPage } from "@/components/batch-calendar-page";
import { getAppData } from "@/lib/data";

export default async function CalendarPage() {
  const { batches, tanks } = await getAppData();
  return <BatchCalendarPage batches={batches} tanks={tanks} />;
}
