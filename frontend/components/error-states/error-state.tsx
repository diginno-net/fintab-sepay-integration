export function ErrorState({ title = 'Không tải được dữ liệu', description }: { title?: string; description: string }) {
  return (
    <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6">
      <h2 className="text-base font-semibold text-red-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-red-800">{description}</p>
    </div>
  );
}
