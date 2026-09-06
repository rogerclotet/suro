import { LinearTransition } from "react-native-reanimated";
export const ITEM_TRANSITION = LinearTransition.springify()
  .damping(24)
  .stiffness(220)
  .mass(0.9);
