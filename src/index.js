import React, {forwardRef, useEffect, useRef, useState} from "react";
import ReactDOM from "react-dom";
import './App.css';
import { ReactSortable } from "react-sortablejs";
import styled from "styled-components"
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";


const BlockWrapper = styled(Grid)`
  position:relative;
  background: white;
  padding: 20px;
  border: 1px solid lightgray;
  border-radius: 4px;
   cursor: move;
  &:hover {
  background: #eeeeee;
  }
`;
const GridContainer = styled(Grid)`
&& {
  background: bisque;
}
`

const GridWrapper = forwardRef((props, ref) => {
    return <GridContainer container spacing={3} ref={ref}>{props.children}</GridContainer>;
});
const sortableOptions = {
    animation: 150,
    fallbackOnBody: true,
    swapThreshold: 0.65,
    ghostClass: 'ghost',
}

function Index() {
    const [rows, setRows] = useState([
        {
            id: 1,
            blocks: [
                {
                    id: 1,
                    name: "item 1",
                    width: 3,
                    row: 1,
                },
                {
                    id: 2,
                    name: "item 2",
                    width: 3,
                    row: 1,
                },
            ]
        },
        {
            id: 2,
            blocks: [
                {
                    id: 5,
                    name: "item 4",
                    width: 3,
                    row: 2,
                    // type: "container",
                    // blocks: [
                    //     { id: 6, name: "item 5", width: 6 },
                    //     { id: 7, name: "item 6", width: 6 }
                    // ]

                },
                {
                    id: 6,
                    name: "item 5",
                    width: 2,
                    row: 2
                },
                {
                    id: 7,
                    name: "item 6",
                    width: 2,
                    row: 2
                }
            ]
        },
    ]);

    useEffect(() => {
        const rowsWithWidths = rows.map(row => ({
            ...row,
            width: row.blocks.reduce((total,block) => total + block.width, 0),
        }));

        setRows(rowsWithWidths);
    },[])
    console.log(rows)
    return (
        <>
            {rows.map((row, index) =>
                <Row
                    key={row.id}
                    row={row}
                    rows={rows}
                    index={index}
                    rowIndex={[index]}
                    setRows={setRows}
                />
            )}
        </>
    );
}
function Row({index, rowIndex, row, setRows, rows}) {

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
    function onDragStart({item, oldIndex}) {
        //Получаем id строки откуда перемещается блок
        const sourceRowId = Number(item.dataset.source);

        //Получаем ширину перемещаемого блока
        const currentBlockWidth = rows[sourceRowId - 1]['blocks'][oldIndex]['width'];


        const emptyRow = (index) => ({id: index, blocks: [], width: 0});

        const newState = rows
            .reduce((result, row, index) => {
                console.log('index', index + rows.length + 2)
                return result.concat(row, emptyRow(index + rows.length + 2))
            }, [emptyRow(rows.length + 1)])
            .map((row) => ({
                ...row,
                width: row.id === sourceRowId ? row.width - currentBlockWidth : row.width + currentBlockWidth
            }));

        setRows(newState);
    }
    function onDragEnd({from, to, item}) {
        //Получаем id строки откуда перемещается блок
        const sourceRowId = Number(item.dataset.source);
        const destinationRowId = to.children[0].dataset.source;
        console.log(to);
        // //Получаем индекс строки, в которую переместился блока
        // const destinationIndex = destination && +destination.droppableId;
        //
        // //Получаем ширину переместившегося блока
        // const currentBlockWidth = rows[sourceIndex]['blocks'][source.index]['width'];
        //
        // const newState = rows.filter(row => row.blocks.length)
        // setRows(newState);
    }

    return (
        <>
            {row.width}
            <ReactSortable
                key={row.id}
                onStart={onDragStart}
                onEnd={onDragEnd}
                direction="horizontal"
                {...sortableOptions}
                group='shared'
                // tag={GridWrapper}
                list={row.blocks}
                setList={currentList => {
                    setRows(sourceList => {
                        const tempList = [...sourceList];
                        const _rowIndex = [...rowIndex];
                        const lastIndex = _rowIndex.pop();
                        const lastArr = _rowIndex.reduce(
                            (arr, i) => arr[i]["blocks"],
                            tempList
                        );
                        lastArr[lastIndex]["blocks"] = currentList;
                        return tempList;
                    });
                }}
            >
                {row.blocks.map((block, blockIndex) => {
                    return (
                        <Grid item xs={block.width} key={block.id} data-id={block.id} data-source={block.row}>
                            <BlockWrapper className="block">
                                {block.type === 'container' && <Row row={block} rowIndex={[...rowIndex, blockIndex]} setRows={setRows} />}
                                {block.type !== 'container' && block.name}
                            </BlockWrapper>
                        </Grid>
                    );
                })}
            </ReactSortable>
        </>
    );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<Index />, rootElement);
