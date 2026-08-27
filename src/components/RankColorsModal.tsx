import React from 'react';
import { RankCustomizationModal } from './RankCustomizationModal';
import { PresetRankItem, DEFAULT_PRESET_RANKS } from '../utils/ranksConfig';
import { AdminMember } from '../types';

interface RankColorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankColors: Record<string, string>;
  onSaveRankColors: (newColors: Record<string, string>) => void;
  initialRankName?: string;
  ranksList?: PresetRankItem[];
  onSaveRanksList?: (newRanks: PresetRankItem[], updatedStaffList?: AdminMember[]) => void;
  staffList?: AdminMember[];
}

export const RankColorsModal: React.FC<RankColorsModalProps> = ({
  isOpen,
  onClose,
  rankColors,
  onSaveRankColors,
  initialRankName,
  ranksList = DEFAULT_PRESET_RANKS,
  onSaveRanksList = () => {},
  staffList = [],
}) => {
  return (
    <RankCustomizationModal
      isOpen={isOpen}
      onClose={onClose}
      ranksList={ranksList}
      onSaveRanksList={onSaveRanksList}
      rankColors={rankColors}
      onSaveRankColors={onSaveRankColors}
      initialRankIdOrName={initialRankName}
      staffList={staffList}
    />
  );
};
