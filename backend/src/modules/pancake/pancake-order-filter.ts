export const PANCAKE_COMPLETED_ORDER_STATUS = 3;
export const PANCAKE_DEFAULT_COMPLETED_DAYS = 3;

export type PancakeOrderUpdateStatus = 'updated_at' | 'created_at' | string;
export type PancakeOrderSortOption = 'updated_at_desc' | 'updated_at_asc' | 'created_at_desc' | 'created_at_asc' | string;

export type PancakeOrderFilterInput = {
  page?: number;
  page_number?: number;
  page_size?: number;
  search?: string;
  status?: string | number;
  pancakeStatus?: string | number;
  filterStatus?: Array<string | number>;
  filter_status?: Array<string | number>;
  completedOnly?: boolean;
  completedDays?: number;
  updateStatus?: PancakeOrderUpdateStatus;
  startDateTime?: number;
  endDateTime?: number;
  date_from?: string;
  date_to?: string;
  dateFrom?: string;
  dateTo?: string;
  optionSort?: PancakeOrderSortOption;
  option_sort?: PancakeOrderSortOption;
};

export type PancakeOrderListQuery = Record<string, string | number | boolean | Array<string | number | boolean>>;

export function buildOrderListQuery(input: PancakeOrderFilterInput = {}): PancakeOrderListQuery {
  const query: PancakeOrderListQuery = {};

  setIfPresent(query, 'page', input.page);
  setIfPresent(query, 'page_number', input.page_number ?? input.page);
  setIfPresent(query, 'page_size', input.page_size);
  setIfPresent(query, 'search', input.search);

  const explicitStatuses = input.filterStatus ?? input.filter_status;
  if (input.completedOnly) {
    query['filter_status[]'] = [PANCAKE_COMPLETED_ORDER_STATUS];
  } else if (explicitStatuses?.length) {
    query['filter_status[]'] = explicitStatuses;
  } else {
    setIfPresent(query, 'status', input.pancakeStatus ?? input.status);
  }

  const completedDays = input.completedOnly ? sanitizeCompletedDays(input.completedDays) : null;
  if (completedDays !== null) {
    const endDateTime = input.endDateTime ?? currentUnixSeconds();
    query.updateStatus = input.updateStatus ?? 'updated_at';
    query.startDateTime = input.startDateTime ?? endDateTime - completedDays * 24 * 60 * 60;
    query.endDateTime = endDateTime;
  } else if (input.updateStatus) {
    query.updateStatus = input.updateStatus;
    setIfPresent(query, 'startDateTime', input.startDateTime);
    setIfPresent(query, 'endDateTime', input.endDateTime);
  } else {
    setIfPresent(query, 'date_from', input.date_from ?? input.dateFrom);
    setIfPresent(query, 'date_to', input.date_to ?? input.dateTo);
  }

  setIfPresent(query, 'option_sort', input.option_sort ?? input.optionSort ?? (input.completedOnly ? 'updated_at_desc' : undefined));

  return query;
}

export function buildCompletedOrderQuery(input: Omit<PancakeOrderFilterInput, 'completedOnly'> = {}): PancakeOrderListQuery {
  return buildOrderListQuery({ ...input, completedOnly: true });
}

function setIfPresent(query: PancakeOrderListQuery, key: string, value: string | number | boolean | Array<string | number | boolean> | null | undefined): void {
  if (value === null || value === undefined) return;
  if (typeof value === 'string' && value.trim() === '') return;
  query[key] = value;
}

function sanitizeCompletedDays(value: number | undefined): number {
  if (!Number.isFinite(value) || value === undefined) return PANCAKE_DEFAULT_COMPLETED_DAYS;
  return Math.max(1, Math.floor(value));
}

function currentUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
