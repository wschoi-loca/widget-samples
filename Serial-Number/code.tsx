// widget-src/code.tsx

const { widget } = figma;
const {
  useSyncedState,
  useWidgetNodeId,
  AutoLayout,
  Text,
  SVG,
  Ellipse,
  Frame,
} = widget;

// 보드에 생성될 큰 숫자 도형의 이름 (선택 시 구분을 위함)
const SPAWNED_NODE_NAME = 'SpawnedNumberedCircle';

// 보드에 생성될 도형의 JSX 컴포넌트
const SpawnedCircle = ({ number }: { number: number }) => (
  <Frame name={SPAWNED_NODE_NAME} width={100} height={100}>
    <Ellipse fill="#1E1E1E" width={100} height={100} />
    <Text
      name="number_text"
      fill="#FFFFFF"
      fontSize={48}
      fontWeight="bold"
      horizontalAlignText="center"
      verticalAlignText="center"
    >
      {String(number)}
    </Text>
  </Frame>
);

function SuperNumberWidget() {
  const [number, setNumber] = useSyncedState('number', 1);
  const widgetId = useWidgetNodeId();

  const handleNumberChange = async (amount: number) => {
    const selection = figma.currentPage.selection;
    const filteredSelection = selection.filter(node => node.name === SPAWNED_NODE_NAME);

    if (filteredSelection.length > 0) {
      await Promise.all(
        filteredSelection.map(async (node) => {
          const textNode = (node as FrameNode).findOne(n => n.name === 'number_text') as TextNode;
          if (textNode) {
            const currentNum = parseInt(textNode.characters) || 0;
            const newNum = currentNum + amount;
            await figma.loadFontAsync(textNode.fontName as FontName);
            textNode.characters = String(newNum);
          }
        })
      );
    } else {
      setNumber(number + amount);
    }
  };

  const spawnShape = async () => {
    const widgetNode = figma.getNodeById(widgetId);
    if (widgetNode) {
      const x = widgetNode.x + widgetNode.width + 50;
      const y = widgetNode.y;
      const newNode = await figma.createNodeFromJSXAsync(<SpawnedCircle number={number} />);
      newNode.x = x;
      newNode.y = y;
      figma.viewport.scrollAndZoomIntoView([newNode]);
    }
  };

  // ⭐️ 자동 넘버링 기능 (수정된 부분)
  const runSerialNumbering = async () => {
    const selection = figma.currentPage.selection;
    let filteredSelection = selection.filter(node => node.name === SPAWNED_NODE_NAME);

    if (filteredSelection.length === 0) return;

    // '왼쪽 상단' 기준으로 정렬
    // 1. Y축(상하) 기준으로 먼저 정렬합니다.
    // 2. Y축 값이 같다면, X축(좌우) 기준으로 정렬합니다.
    filteredSelection.sort((a, b) => {
      // Y 좌표가 다르면 Y 좌표로 정렬 (더 작은 Y가 위쪽)
      if (Math.round(a.y) !== Math.round(b.y)) {
        return a.y - b.y;
      }
      // Y 좌표가 같으면 X 좌표로 정렬 (더 작은 X가 왼쪽)
      return a.x - b.x;
    });

    await Promise.all(
      filteredSelection.map(async (node, index) => {
        const textNode = (node as FrameNode).findOne(n => n.name === 'number_text') as TextNode;
        if (textNode) {
          await figma.loadFontAsync(textNode.fontName as FontName);
          textNode.characters = String(index + 1);
        }
      })
    );
  };

  return (
    <AutoLayout
      name="SuperNumberWidget"
      direction="vertical"
      width="fill-parent"
      height="fill-parent"
      spacing={8}
      padding={8}
      cornerRadius={12}
      fill="#FFFFFF"
      stroke="#E6E6E6"
      verticalAlignItems="center"
      horizontalAlignItems="center"
    >
      <AutoLayout spacing={12} verticalAlignItems="center">
        <Frame hoverStyle={{ opacity: 0.7 }} cornerRadius={8} onClick={() => handleNumberChange(-1)}>
          <Text fontSize={24} width={32} height={32} horizontalAlignText="center" verticalAlignText="center">-</Text>
        </Frame>
        <Frame hoverStyle={{ opacity: 0.7 }} cornerRadius={8} onClick={spawnShape}>
           <Text fontSize={32} fontWeight="bold">{String(number)}</Text>
        </Frame>
        <Frame hoverStyle={{ opacity: 0.7 }} cornerRadius={8} onClick={() => handleNumberChange(1)}>
          <Text fontSize={24} width={32} height={32} horizontalAlignText="center" verticalAlignText="center">+</Text>
        </Frame>
      </AutoLayout>
      
      <AutoLayout spacing={8}>
        <Frame
          hoverStyle={{ opacity: 0.7 }}
          padding={{ vertical: 8, horizontal: 12 }}
          fill="#F0F0F0"
          cornerRadius={8}
          onClick={spawnShape}
        >
          <Text fontSize={14}>Spawn</Text>
        </Frame>
        <Frame
          hoverStyle={{ opacity: 0.7 }}
          padding={{ vertical: 8, horizontal: 12 }}
          fill="#F0F0F0"
          cornerRadius={8}
          onClick={runSerialNumbering}
        >
          <Text fontSize={14}>Serial</Text>
        </Frame>
      </AutoLayout>
    </AutoLayout>
  );
}

widget.register(SuperNumberWidget);