import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { setSelectedRate } from '@/store/slices/rateSlice';
import type { RateType } from '@/store/slices/rateSlice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const RateSelector = () => {
  const dispatch = useDispatch();
  const { selectedRate, rateLabels } = useSelector((state: RootState) => state.rate);

  const rateOptions: { value: RateType; label: string }[] = [
    { value: 'rate1', label: rateLabels.rate1 },
    { value: 'rate2', label: rateLabels.rate2 },
    { value: 'rate3', label: rateLabels.rate3 },
    { value: 'rate4', label: rateLabels.rate4 },
    { value: 'rate5', label: rateLabels.rate5 },
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">Rate:</span>
      <Select
        value={selectedRate}
        onValueChange={(value: RateType) => dispatch(setSelectedRate(value))}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {rateOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RateSelector;