import { useState } from 'react';
import { Image, Text, View } from 'react-native';

type Props = {
  uri: string | null | undefined;
  style: any;
  emoji: string;
  color: string;
  emojiStyle?: any;
};

export default function RecipeImage({ uri, style, emoji, color, emojiStyle }: Props) {
  const [error, setError] = useState(false);

  if (!uri || error) {
    return (
      <View style={[style, { backgroundColor: color, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={emojiStyle}>{emoji}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
}