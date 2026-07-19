/** 列表排序用的最小字段，兼容 Provider / UniversalProvider */
export type ProviderSortable = {
  name: string;
  createdAt?: number;
  sortIndex?: number;
};

/** 应用页：拖拽顺序优先（sortIndex 升序），名称作 tiebreaker */
export function compareProvidersBySortIndex(
  a: ProviderSortable,
  b: ProviderSortable,
  locale = "zh-CN",
): number {
  const indexA = a.sortIndex ?? Number.MAX_SAFE_INTEGER;
  const indexB = b.sortIndex ?? Number.MAX_SAFE_INTEGER;
  if (indexA !== indexB) {
    return indexA - indexB;
  }

  return a.name.localeCompare(b.name, locale);
}

/** 模型中心：仅按添加时间降序（新在前）；无 createdAt 的历史数据排到最后 */
export function compareProvidersByCreatedAt(
  a: ProviderSortable,
  b: ProviderSortable,
  locale = "zh-CN",
): number {
  const timeA = a.createdAt ?? 0;
  const timeB = b.createdAt ?? 0;
  if (timeA === 0 && timeB === 0) {
    return a.name.localeCompare(b.name, locale);
  }
  if (timeA === 0) return 1;
  if (timeB === 0) return -1;
  if (timeA !== timeB) {
    return timeB - timeA;
  }

  return a.name.localeCompare(b.name, locale);
}
