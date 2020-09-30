import React, {useEffect, useRef, useState} from "react";
import ReactDOM from "react-dom";
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import './App.css';
import styled from "styled-components";
import {ResizableBox} from "react-resizable";
import {css} from "@material-ui/system";

const ResizeHandle = styled.div`
    position: absolute;
    width: 20px;
    height: 20px;
    right: -15px;
    border-left: 2px solid lightgrey;
    cursor: e-resize;
    top: 50%;
    transform: translateY(-50%);
    z-index: 3;
`;
const StyledGrid = styled(Grid)`
    && {
        //margin-bottom: ${props => props.$width ? '10px' : '0'};
        //min-height: ${props => props.$width ? '0' : '0.1px'};
        background: ${props => props.$isDraggingOver ? 'lightblue' : '#eeeeee'};
        //border: ${props => props.$draggingFromThisWith ? '40' : '0'}px solid red;
        //  position: ${props => props.$width ? 'relative' : 'absolute'};
        //align-items: center;
        //margin-bottom: ${props => props.$width ? '5px' : '0'};
    }
`;

// const getListStyle = isDraggingOver => ({
//     background: isDraggingOver ? "lightblue" : "lightgrey",
//     width: '100%',
// });
// fake data generator
const getItems = (count, offset = 0) =>
    Array.from({ length: count }, (v, k) => k).map(k => ({
        id: `item-${k + offset}-${new Date().getTime()}`,
        content: `item ${k + offset}`,
        order: k,
        width: Math.floor(Math.random() * 4) + 1
        // width: 1
    }));



const getItemStyle = (snapshot, draggableStyle, isDragging) => {
    const height = isDragging ? "50px" : "auto";
    console.log(height);
    return {
        // some basic styles to make the items look a bit nicer
        userSelect: "none",
        height,
        position: 'relative',
        // change background colour if dragging
        background: snapshot.isDragging ? "lightgreen" : "grey",
        // styles we need to apply on draggables
        ...draggableStyle
    }
};

/**
 * Перемещает блок внутри одной строки
 *
 * @param blocks - Массив блоков
 * @param startIndex - Индекс места откуда перемещается блок
 * @param endIndex - Индекс места куда перемещается блок
 */
function reorderBlocks(blocks, startIndex, endIndex) {
    const result = Array.from(blocks);

    result[startIndex]['order'] = endIndex;
    result[endIndex]['order'] = startIndex;
    return result;
}

/**
 * Перемещает блок с одной строки на другую
 *
 * @param sourceRowBlocks - Блоки строки откуда перемещается блок
 * @param destinationRowBlocks - Блоки строки, в которую перемещается блок
 * @param droppableSource
 * @param droppableDestination
 */
function moveBlocks(sourceRowBlocks, destinationRowBlocks, droppableSource, droppableDestination) {

    const newSourceRowBlocks = [...sourceRowBlocks]
    //Извлекаем из блоков начальной строки перемещаемый блок
    const [currentBlock] = newSourceRowBlocks.splice(droppableSource.index, 1);

    //Переназначаем порядок блоков начальной строки
    const reorderedSourceBlocks = newSourceRowBlocks.map(block =>
        ({...block, order: block.order > droppableSource.index ? block.order - 1 : block.order}));

    //Переназначаем порядок блоков конечной строки
    const reorderedDestinationBlocks = [...destinationRowBlocks].map(block =>
        ({...block, order: block.order >= droppableDestination.index ? block.order + 1 : block.order}));

    const reorderedDestinationBlocksWithNewBlock = [...reorderedDestinationBlocks, currentBlock];

    //Переназначаем порядок перемещаемой строки
    currentBlock.order = droppableDestination.index;

    const movedBlocks = {};
    movedBlocks[droppableSource.droppableId] = reorderedSourceBlocks;
    movedBlocks[droppableDestination.droppableId] = reorderedDestinationBlocksWithNewBlock;

    return movedBlocks;
}

function QuoteApp() {
    const [state, setState] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const rows = [getItems(1),getItems(3, 3)];
        const rowsWithWidths = rows.map(row => ({
            width: row.reduce((total,block) => total + block.width, 0),
            blocks: row
        }));
        setState(rowsWithWidths);
    }, [])

    if(state.length === 0) return null;

    /**
     * При начале перетаскивания блока вычисляет ширину строки
     * без перетаскиваемого блока, затем вычисляет ширину остальных строк
     * с прибавлением ширины перетаскиваемого блока, после чего обновляет
     * состояние строк.
     *
     * Для чего это нужно:
     * От ширины строки зависит значение isDropDisabled.
     * Если значение isDropDisabled у строки равно true, то добавление
     * новых блоков в эту строку запрещено. Сделано это, чтобы в строку нельзя
     * было добавить новый блок, если ширина этой строки равна максимальным 12-ти
     * или превышает 12, если считать вместе с шириной передвигаемого блока.
     *
     * isDropDisabled также запрещает перемещение уже существующих блоков
     * внутри строки с этой настройкой. Чтобы это решить в начале
     * перетаскивания ширина перемещаемого блока вычитается из ширины строки,
     * делая ширину строки меньше 12 и таким образом временно отключая
     * isDropDisabled.
     */
    function onDragStart({source}) {
        //Получаем индекс строки перемещаемого блока
        const sourceIndex = +source.droppableId;

        //Получаем ширину перемещаемого блока
        const currentBlockWidth = state[sourceIndex]['blocks'][source.index]['width'];

        //Вычисляем и обновляем ширину строк
        const newState = state.map((row, index) => ({
            ...row,
            width: index === sourceIndex ? row.width - currentBlockWidth : row.width + currentBlockWidth
        }));
        // const newState = state.map((row, index) => {
        //     let newWidth = index === sourceIndex ? row.width - currentBlockWidth : row.width + currentBlockWidth;
        //     if (row.width === 0) {
        //         newWidth = 0;
        //     } else {
        //         newWidth = index === sourceIndex ? row.width - currentBlockWidth : row.width + currentBlockWidth;
        //     }
        //     return {
        //         ...row,
        //         width: newWidth
        //     };
        // });
        setState(newState);
    }

    /**
     * По окончанию перетаскивания обновляет ширину строк и порядок блоков
     *
     * @param source
     * @param destination
     */
    function onDragEnd({ source, destination }) {

        setIsDragging(false);
        //Получаем индекс строки, из которой переместился блок
        const sourceIndex = +source.droppableId;

        //Получаем индекс строки, в которую переместился блока
        const destinationIndex = destination && +destination.droppableId;

        //Получаем ширину переместившегося блока
        const currentBlockWidth = state[sourceIndex]['blocks'][source.index]['width'];

        const isMovedBetweenRows = sourceIndex !== destinationIndex

        const newState = [...state];

        //Если блок никуда не переместился
        if (!destination || (!isMovedBetweenRows && source.index === destination.index)) {
            setState(
                newState
                    .map((row, index) => ({
                        ...row,
                        width: index === sourceIndex ? row.width + currentBlockWidth : row.width - currentBlockWidth
                    }))
                    .filter(row => row.blocks.length) //Удаляем пустые строки;
            );
            return;
        }

        if (isMovedBetweenRows) {
            const movedBlocks = moveBlocks(state[sourceIndex].blocks, state[destinationIndex].blocks, source, destination);

            newState[sourceIndex].blocks = movedBlocks[sourceIndex];
            newState[destinationIndex].blocks = movedBlocks[destinationIndex];


            setState(newState
                .map((row, index) => {
                    if(index === sourceIndex) {
                        return { ...row, blocks: movedBlocks[sourceIndex] }
                    } else if (index === destinationIndex) {
                        return { ...row, blocks: movedBlocks[destinationIndex] }
                    } else {
                        return { ...row, width: row.width - currentBlockWidth }
                    }
                })
                .filter(row => row.blocks.length)
            )
        } else {
            const reorderedSourceBlocks = reorderBlocks(state[sourceIndex].blocks, source.index, destination.index);

            setState(newState
                .map((row, index) => ({
                    blocks: index === sourceIndex ? reorderedSourceBlocks : row.blocks,
                    width: index === sourceIndex ? row.width + currentBlockWidth : row.width - currentBlockWidth
                }))
                .filter(row => row.blocks.length)
            );

        }
    }

    const onBeforeCapture = (beforeCapture) => {
        const emptyRow = {blocks: [], width: 0};
        const newState = state.reduce((result, row) => result.concat(row, emptyRow), [emptyRow]);
        setState(newState);
        setIsDragging(beforeCapture.draggableId);
    }

    const updateBlockWidth = (blockIndex, rowIndex, operationType) => {
        const newState = [...state];

        if (operationType === 'increment') {
            newState[rowIndex]['blocks'][blockIndex].width++;
            newState[rowIndex].width++;
        } else {
            newState[rowIndex]['blocks'][blockIndex].width--;
            newState[rowIndex].width--;
        }

        setState(newState);
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => {
                    setState([...state, {blocks: [], width: 0}]);
                }}
            >
                Add new group
            </button>
            <button
                type="button"
                onClick={() => {
                    const newBlock = getItems(1);
                    setState([...state, {blocks: newBlock, width: newBlock[0].width}]);
                }}
            >
                Add new item
            </button>
            <div style={{ display: "flex", flexDirection: 'column' }}>
                <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart} onBeforeCapture={onBeforeCapture}>
                    {state.map((row, rowIndex) => (
                        <Row key={rowIndex} row={row} rowIndex={rowIndex} isDragging={isDragging} updateBlockWidth={updateBlockWidth} />
                    ))}
                </DragDropContext>
            </div>
        </div>
    );
}

function Row({row, rowIndex, updateBlockWidth, isDragging}) {
    return (
        <Droppable isDropDisabled={row.width > 12} key={rowIndex} droppableId={`${rowIndex}`} direction="horizontal">
            {(provided, snapshot) => (
                <div>
                    {/*{row.width}*/}
                    <StyledGrid container
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                $isDraggingOver={snapshot.isDraggingOver}
                                $draggingFromThisWith={snapshot.draggingFromThisWith}
                    >
                        {row.blocks && row.blocks.sort((a, b) => Number(a.order) - Number(b.order)).map((block, blockIndex) => (
                            <BlockWrapper key={blockIndex} {...block} isDragging={isDragging} blockIndex={blockIndex} rowIndex={rowIndex} rowWidth={row.width} updateBlockWidth={updateBlockWidth} />
                        ))}
                        {provided.placeholder}
                    </StyledGrid>
                </div>
            )}
        </Droppable>
    );
}

function BlockWrapper({blockIndex, ind, rowIndex, rowWidth, updateBlockWidth,isDragging, ...block}) {
    const parentRef = useRef();
    const [pixelWidth, setPixelWidth] = useState(0);
    const [initialPosition, setInitialPosition] = useState(0);
    const [isResizing, setIsResizing] = useState(false)

    const singleColumnWidthInPixels = pixelWidth / block.width;

    useEffect ( () => {
        setPixelWidth(parentRef.current.offsetWidth);
    }, []);

    const resize = (event) => {
        const currentPosition = event.screenX;

        const diff = (currentPosition - initialPosition) / singleColumnWidthInPixels;

        if (diff + 0.1 >= 1 && block.width <= 12 && rowWidth < 12) {
            updateBlockWidth(blockIndex, rowIndex, 'increment');
            setPixelWidth(pixelWidth + singleColumnWidthInPixels);
            setInitialPosition(currentPosition)
        }
        if (diff - 0.1 <= -1 && block.width > 1) {
            updateBlockWidth(blockIndex, rowIndex, 'decrement');
            setPixelWidth(pixelWidth - singleColumnWidthInPixels);
            setInitialPosition(currentPosition)
        }
    }
    const onUp = () => {
        setIsResizing(false);
    }
    const onDown = (event) => {
        setInitialPosition(event.screenX);
        setIsResizing(true);
    }
    if(isResizing) {
        document.body.style.cursor = "e-resize";
        document.onpointermove = resize;
        document.onpointerup = onUp;
    } else {
        document.body.style.cursor = "default";
        document.onpointermove = null;
        document.onpointerup = null;
    }

    return(
        <Draggable
            key={block.id}
            draggableId={block.id}
            index={blockIndex}
        >
            {(provided, snapshot) => (
                <Box component={Grid} item xs={block.width}
                     ref={provided.innerRef}
                     {...provided.draggableProps}
                     style={getItemStyle(
                         snapshot,
                         provided.draggableProps.style,
                         block.id === isDragging
                     )}
                >
                    <div className="wrapper" ref={parentRef} style={{position: 'relative', height: '100%'}}>
                        <div
                            className="resHandle"
                            {...provided.dragHandleProps}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                zIndex: 2,
                            }}
                        />
                        <ResizeHandle
                            onPointerDown={onDown}
                        />
                        <div style={{height: block.id === isDragging ? 'calc(100% - 40px)' : 80}}>
                            {block.content}
                        </div>
                    </div>
                </Box>
            )}
        </Draggable>
    );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<QuoteApp />, rootElement);
