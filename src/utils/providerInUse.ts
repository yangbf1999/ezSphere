import type { AppId } from "@/lib/api";

export interface ResolveStoredCurrentInput {
  appId: AppId;
  providerId: string;
  /** providersApi.getCurrent 结果 */
  storedCurrentId: string;
  /** Hermes live model.provider */
  hermesCurrentId?: string | null;
  /** OpenCode OMO / OMO Slim 当前 id */
  omoCurrentId?: string | null;
  omoSlimCurrentId?: string | null;
  isOmo?: boolean;
  isOmoSlim?: boolean;
}

/**
 * ProviderList 传给卡片的 isCurrent：
 * - Hermes → live model.provider
 * - OMO / OMO Slim → 各自当前 id
 * - 其余 → providersApi.getCurrent
 */
export function resolveStoredCurrent({
  appId,
  providerId,
  storedCurrentId,
  hermesCurrentId,
  omoCurrentId,
  omoSlimCurrentId,
  isOmo = false,
  isOmoSlim = false,
}: ResolveStoredCurrentInput): boolean {
  if (isOmo) return providerId === (omoCurrentId || "");
  if (isOmoSlim) return providerId === (omoSlimCurrentId || "");
  if (appId === "hermes") return hermesCurrentId === providerId;
  return providerId === storedCurrentId;
}

export interface ResolveProviderInUseInput {
  appId: AppId;
  providerId: string;
  /** resolveStoredCurrent 的结果 */
  isCurrent: boolean;
  isOmo?: boolean;
  isOmoSlim?: boolean;
  /** OpenClaw 默认模型归属 */
  isDefaultModel?: boolean;
  /**
   * 代理接管 + 自动故障转移均开启
   *（对应 ProviderCard 的 isAutoFailoverEnabled 入参）
   */
  isFailoverModeActive?: boolean;
  /** 代理当前实际使用的模型 id */
  activeProviderId?: string;
}

/**
 * 与 ProviderCard「当前 / 使用中」一致：
 * - OMO/OMO Slim → isCurrent
 * - OpenClaw → 默认模型归属
 * - OpenCode（非 OMO）→ 无「当前」概念
 * - 故障转移模式 → activeProviderId
 * - 普通模式 → isCurrent
 */
export function resolveProviderInUse({
  appId,
  providerId,
  isCurrent,
  isOmo = false,
  isOmoSlim = false,
  isDefaultModel = false,
  isFailoverModeActive = false,
  activeProviderId,
}: ResolveProviderInUseInput): boolean {
  const isAnyOmo = isOmo || isOmoSlim;
  if (isAnyOmo) return isCurrent;
  if (appId === "openclaw") return Boolean(isDefaultModel);
  if (appId === "opencode") return false;
  if (isFailoverModeActive) return activeProviderId === providerId;
  return isCurrent;
}
