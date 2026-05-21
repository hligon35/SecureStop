import renderer from "react-test-renderer";

import { MonoText } from "../StyledText";

it(`renders correctly`, async () => {
  let root;

  await renderer.act(async () => {
    root = renderer.create(<MonoText>Snapshot test!</MonoText>);
  });

  const tree = root.toJSON();

  expect(tree).toMatchSnapshot();

  await renderer.act(async () => {
    root.unmount();
  });
});
