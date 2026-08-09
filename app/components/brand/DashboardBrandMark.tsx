import VitalTwinMark from './VitalTwinMark';

/**
 * Large icon-only brand mark shown once directly beneath the Dashboard
 * navigation, before any section content. Central/shared component so every
 * page using the Dashboard navigation gets the same treatment automatically
 * instead of duplicating markup per page or per anchor section.
 */
export default function DashboardBrandMark() {
  return (
    <div className="flex justify-center py-3 md:py-6">
      <VitalTwinMark variant="icon" theme="dark" className="h-10 w-auto sm:h-12 md:h-14" />
    </div>
  );
}
