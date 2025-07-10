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
  // 위젯의 기본 숫자를 상태로 관리
  const [number, setNumber] = useSyncedState('number', 1);
  const widgetId = useWidgetNodeId();

  // 기능 2, 6: 숫자 변경 (-/+) 및 다중 선택 객체 숫자 변경
  const handleNumberChange = async (amount: number) => {
    const selection = figma.currentPage.selection;
    const filteredSelection = selection.filter(node => node.name === SPAWNED_NODE_NAME);

    if (filteredSelection.length > 0) {
      // 다중 선택된 도형이 있을 경우
      await Promise.all(
        filteredSelection.map(async node => {
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
      // 선택된 도형이 없으면 위젯의 숫자 변경
      setNumber(number + amount);
    }
  };

  // 기능 3, 4: 도형 생성 (spawn 버튼 및 숫자 클릭)
  const spawnShape = async () => {
    const widgetNode = figma.getNodeById(widgetId);
    if (widgetNode) {
      const x = widgetNode.x + widgetNode.width + 50; // 위젯 오른쪽에 생성
      const y = widgetNode.y;
      const newNode = await figma.createNodeFromJSXAsync(<SpawnedCircle number={number} />);
      newNode.x = x;
      newNode.y = y;
      figma.viewport.scrollAndZoomIntoView([newNode]);
    }
  };

  // 기능 5: 자동 넘버링 (serial 버튼)
  const runSerialNumbering = async () => {
    const selection = figma.currentPage.selection;
    let filteredSelection = selection.filter(node => node.name === SPAWNED_NODE_NAME);

    if (filteredSelection.length === 0) return;

    // X축 -> Y축 순서로 정렬
    filteredSelection.sort((a, b) => {
      if (Math.round(a.x) !== Math.round(b.x)) {
        return a.x - b.x;
      }
      return a.y - b.y;
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
    <AutoLayout // 기능 1: 크기 조절을 위해 fill-parent 사용
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
      {/* --- 숫자 변경 UI --- */}
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
      
      {/* --- 기능 버튼 UI --- */}
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