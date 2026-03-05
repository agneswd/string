import { useSyncExternalStore, useRef, useCallback } from 'react'

import type { StringState } from './stringStore'
import { stringStore } from './stringStore'

const subscribe = (onStoreChange: () => void): (() => void) =>
  stringStore.subscribe(() => onStoreChange())

const stringActions = {
  connect: () => stringStore.connect(),
  disconnect: () => stringStore.disconnect(),
  clearAuthAndDisconnect: () => stringStore.clearAuthAndDisconnect(),
  registerUser: (params: Parameters<typeof stringStore.registerUser>[0]) => stringStore.registerUser(params),
  createGuild: (params: Parameters<typeof stringStore.createGuild>[0]) => stringStore.createGuild(params),
  joinGuild: (params: Parameters<typeof stringStore.joinGuild>[0]) => stringStore.joinGuild(params),
  createChannel: (params: Parameters<typeof stringStore.createChannel>[0]) => stringStore.createChannel(params),
  sendMessage: (params: Parameters<typeof stringStore.sendMessage>[0]) => stringStore.sendMessage(params),
  deleteMessage: (params: Parameters<typeof stringStore.deleteMessage>[0]) => stringStore.deleteMessage(params),
  editMessage: (params: Parameters<typeof stringStore.editMessage>[0]) => stringStore.editMessage(params),
  createDmChannel: (params: Parameters<typeof stringStore.createDmChannel>[0]) => stringStore.createDmChannel(params),
  leaveDmChannel: (params: Parameters<typeof stringStore.leaveDmChannel>[0]) => stringStore.leaveDmChannel(params),
  sendDmMessage: (params: Parameters<typeof stringStore.sendDmMessage>[0]) => stringStore.sendDmMessage(params),
  editDmMessage: (params: Parameters<typeof stringStore.editDmMessage>[0]) => stringStore.editDmMessage(params),
  deleteDmMessage: (params: Parameters<typeof stringStore.deleteDmMessage>[0]) => stringStore.deleteDmMessage(params),
  addReaction: (params: Parameters<typeof stringStore.addReaction>[0]) => stringStore.addReaction(params),
  removeReaction: (params: Parameters<typeof stringStore.removeReaction>[0]) => stringStore.removeReaction(params),
  toggleReaction: (params: Parameters<typeof stringStore.toggleReaction>[0]) => stringStore.toggleReaction(params),
  toggleDmReaction: (params: Parameters<typeof stringStore.toggleDmReaction>[0]) => stringStore.toggleDmReaction(params),
  acceptGuildInvite: (params: Parameters<typeof stringStore.acceptGuildInvite>[0]) => stringStore.acceptGuildInvite(params),
  declineGuildInvite: (params: Parameters<typeof stringStore.declineGuildInvite>[0]) => stringStore.declineGuildInvite(params),
  sendFriendRequest: (params: Parameters<typeof stringStore.sendFriendRequest>[0]) => stringStore.sendFriendRequest(params),
  acceptFriendRequest: (params: Parameters<typeof stringStore.acceptFriendRequest>[0]) => stringStore.acceptFriendRequest(params),
  declineFriendRequest: (params: Parameters<typeof stringStore.declineFriendRequest>[0]) => stringStore.declineFriendRequest(params),
  cancelFriendRequest: (params: Parameters<typeof stringStore.cancelFriendRequest>[0]) => stringStore.cancelFriendRequest(params),
  removeFriend: (params: Parameters<typeof stringStore.removeFriend>[0]) => stringStore.removeFriend(params),
  joinVoice: (params: Parameters<typeof stringStore.joinVoice>[0]) => stringStore.joinVoice(params),
  joinVoiceDm: (params: Parameters<typeof stringStore.joinVoiceDm>[0]) => stringStore.joinVoiceDm(params),
  leaveVoice: () => stringStore.leaveVoice(),
  updateVoiceState: (params: Parameters<typeof stringStore.updateVoiceState>[0]) => stringStore.updateVoiceState(params),
  sendRtcSignal: (params: Parameters<typeof stringStore.sendRtcSignal>[0]) => stringStore.sendRtcSignal(params),
  sendDmRtcSignal: (params: Parameters<typeof stringStore.sendDmRtcSignal>[0]) => stringStore.sendDmRtcSignal(params),
  ackRtcSignal: (params: Parameters<typeof stringStore.ackRtcSignal>[0]) => stringStore.ackRtcSignal(params),
  updateProfile: (params: Parameters<typeof stringStore.updateProfile>[0]) => stringStore.updateProfile(params),
  setStatus: (params: Parameters<typeof stringStore.setStatus>[0]) => stringStore.setStatus(params),
  initiateDmCall: (params: Parameters<typeof stringStore.initiateDmCall>[0]) => stringStore.initiateDmCall(params),
  acceptDmCall: (params: Parameters<typeof stringStore.acceptDmCall>[0]) => stringStore.acceptDmCall(params),
  declineDmCall: (params: Parameters<typeof stringStore.declineDmCall>[0]) => stringStore.declineDmCall(params),
  setActiveSubscriptions: (
    selectedTextChannelId?: string,
    selectedDmChannelId?: string,
  ) => stringStore.setActiveSubscriptions(selectedTextChannelId, selectedDmChannelId),
}

export function useStringStore(): StringState;
export function useStringStore<T>(selector: (state: StringState) => T): T;
export function useStringStore<T = StringState>(selector?: (state: StringState) => T): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const prevRef = useRef<T | undefined>(undefined);

  const getSnapshot = useCallback((): T => {
    const state = stringStore.getState();
    if (!selectorRef.current) return state as unknown as T;

    const next = selectorRef.current(state);

    // Return previous reference if strictly equal (prevents re-renders for primitives)
    if (prevRef.current !== undefined && Object.is(prevRef.current, next)) {
      return prevRef.current;
    }
    prevRef.current = next;
    return next;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useStringActions() {
  return stringActions
}
