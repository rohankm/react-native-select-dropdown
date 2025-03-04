import React, {forwardRef, useImperativeHandle, useState} from 'react';
import {View, Text, TouchableOpacity, FlatList, Switch} from 'react-native';
import styles from './styles';
import {isExist} from './helpers/isExist';
import Input from './components/Input';
import DropdownOverlay from './components/DropdownOverlay';
import DropdownModal from './components/DropdownModal';
import DropdownWindow from './components/DropdownWindow';
import {useSelectDropdown} from './hooks/useSelectDropdown';
import {useLayoutDropdown} from './hooks/useLayoutDropdown';
import {useRefs} from './hooks/useRefs';

const SelectDropdown = (
  {
    data /* array */,
    onSelect /* function  */,
    defaultButtonText /* String */,
    buttonTextAfterSelection /* function or string */,
    rowTextForSelection /* function */,
    defaultValue /* any */,
    defaultValueByIndex /* integer */,
    disabled /* boolean */,
    disableAutoScroll /* boolean */,
    disabledIndexs /* array of disabled Row index */,
    onFocus /* function  */,
    onBlur /* function  */,
    onScrollEndReached /* function  */,
    /////////////////////////////
    buttonStyle /* style object for button */,
    buttonTextStyle /* style object for button text */,
    renderCustomizedButtonChild /* function returns React component for customized button */,
    /////////////////////////////
    renderDropdownIcon,
    dropdownIconPosition,
    statusBarTranslucent,
    dropdownStyle,
    dropdownOverlayColor /* string */,
    /////////////////////////////
    rowStyle /* style object for row */,
    rowTextStyle /* style object for row text */,
    selectedRowStyle /* style object for selected row */,
    disabledStyle,
    selectedRowTextStyle /* style object for selected row text */,
    renderCustomizedRowChild /* function returns React component for customized row */,
    /////////////////////////////
    search /* boolean */,
    searchInputStyle /* style object for search input */,
    searchInputTxtColor /* text color for search input */,
    searchInputTxtStyle /* text style for search input */,
    searchPlaceHolder /* placeholder text for search input */,
    searchPlaceHolderColor /* text color for search input placeholder */,
    renderSearchInputLeftIcon /* function returns React component for search input icon */,
    renderSearchInputRightIcon /* function returns React component for search input icon */,
    onChangeSearchInputText /* function callback when the search input text changes, this will automatically disable the dropdown's interna search to be implemented manually outside the component  */,
    onlyDropdownIcon = false /*shows only drop down icon and ignores the text */,
    textNumberOfLines = 1 /*Drop Down Button Text number of lines (numberOfLines prop for Text) */,
    multipleSelect = false /*Select Multiple values from the Drop down List */,
    searchKey /*search key if the data is object default searches all */,
    emptyStyle /*Empty data style */,
    allowSelectAll = false /*Allows user to select all data (works only if multiple select is true) */,
  },
  ref,
) => {
  const disabledInternalSearch = !!onChangeSearchInputText;
  /* ******************* hooks ******************* */
  const {dropdownButtonRef, dropDownFlatlistRef} = useRefs();
  const {
    dataArr, //
    selectedItem,
    selectedIndex,
    selectItem,
    reset,
    searchTxt,
    setSearchTxt,
    selectAll,
    toggleSeletAll,
  } = useSelectDropdown(data, defaultValueByIndex, defaultValue, disabledInternalSearch, multipleSelect, searchKey);
  const {
    isVisible, //
    setIsVisible,
    buttonLayout,
    onDropdownButtonLayout,
    getItemLayout,
    dropdownWindowStyle,
  } = useLayoutDropdown(data, dropdownStyle, rowStyle, search);
  useImperativeHandle(ref, () => ({
    reset: () => {
      reset();
    },
    openDropdown: () => {
      openDropdown();
    },
    closeDropdown: () => {
      closeDropdown();
    },
    selectIndex: index => {
      selectItem(index);
    },
  }));
  /* ******************* Methods ******************* */
  const openDropdown = () => {
    dropdownButtonRef.current.measure((fx, fy, w, h, px, py) => {
      onDropdownButtonLayout(w, h, px, py);
      setIsVisible(true);
      onFocus && onFocus();
    });
  };
  const closeDropdown = () => {
    if (multipleSelect) {
      onSelect &&
        onSelect(
          selectedItem.map(d => d.item),
          selectedIndex,
        );
    }
    setIsVisible(false);
    setSearchTxt('');
    onBlur && onBlur();
  };
  const onLayout = () => {
    if (disableAutoScroll) {
      return;
    }
    if (selectedIndex >= 3 && dropDownFlatlistRef) {
      dropDownFlatlistRef.current.scrollToOffset({
        offset: rowStyle && rowStyle.height ? rowStyle.height * selectedIndex : 50 * selectedIndex,
        animated: true,
      });
    }
  };
  const onSelectItem = (item, index) => {
    if (multipleSelect) {
      selectItem(index);
      toggleSeletAll(false);
      return;
    }
    closeDropdown();
    onSelect && onSelect(item, index);
    selectItem(index);
  };
  /* ******************** Render Methods ******************** */
  const renderSearchView = () => {
    return (
      search && (
        <Input
          searchViewWidth={buttonLayout.w}
          value={searchTxt}
          valueColor={searchInputTxtColor}
          placeholder={searchPlaceHolder}
          placeholderTextColor={searchPlaceHolderColor}
          onChangeText={txt => {
            setSearchTxt(txt);
            disabledInternalSearch && onChangeSearchInputText(txt);
          }}
          inputStyle={searchInputStyle}
          inputTextStyle={searchInputTxtStyle}
          renderLeft={renderSearchInputLeftIcon}
          renderRight={renderSearchInputRightIcon}
        />
      )
    );
  };
  const renderSelectAll = () => {
    return (
      multipleSelect &&
      allowSelectAll && (
        <View style={styles.allowAllStyle}>
          <Text style={{color: 'gray', fontSize: 10}}>Select All</Text>
          <Switch
            onValueChange={() => {
              toggleSeletAll();
            }}
            value={selectAll}
          />
        </View>
      )
    );
  };
  const renderFlatlistItem = ({item, index}) => {
    const isSelected = multipleSelect ? selectedIndex.filter(d => d == index).length > 0 : index == selectedIndex;
    const disable = disabledIndexs?.includes(index);
    return (
      isExist(item) && (
        <TouchableOpacity
          disabled={disable}
          activeOpacity={0.8}
          style={{
            ...styles.dropdownRow,
            ...rowStyle,
            ...(isSelected && selectedRowStyle),
            ...(disable && disabledStyle),
          }}
          onPress={() => onSelectItem(item, index)}>
          {renderCustomizedRowChild ? (
            <View style={styles.dropdownCustomizedRowParent}>
              {renderCustomizedRowChild(item, index, isSelected, disable)}
            </View>
          ) : (
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              style={{...styles.dropdownRowText, ...rowTextStyle, ...(isSelected && selectedRowTextStyle)}}>
              {rowTextForSelection ? rowTextForSelection(item, index) : item.toString()}
            </Text>
          )}
        </TouchableOpacity>
      )
    );
  };
  const renderDropdown = () => {
    return (
      isVisible && (
        <DropdownModal statusBarTranslucent={statusBarTranslucent} visible={isVisible}>
          <DropdownOverlay onPress={closeDropdown} backgroundColor={dropdownOverlayColor} />
          <DropdownWindow layoutStyle={dropdownWindowStyle}>
            {data.length > 0 && (
              <View>
                {renderSelectAll()}
                {renderSearchView()}
              </View>
            )}
            <FlatList
              data={dataArr}
              estimatedItemSize={50}
              extraData={selectedIndex}
              keyExtractor={(item, index) => index.toString()}
              ref={dropDownFlatlistRef}
              renderItem={renderFlatlistItem}
              getItemLayout={getItemLayout}
              onLayout={onLayout}
              keyboardShouldPersistTaps="always"
              onEndReached={() => onScrollEndReached && onScrollEndReached()}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                <Text
                  style={{...styles.dropdownRowText, ...rowTextStyle, marginTop: 20, ...(emptyStyle && emptyStyle)}}>
                  List Empty
                </Text>
              }
            />
          </DropdownWindow>
        </DropdownModal>
      )
    );
  };
  ///////////////////////////////////////////////////////
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      ref={dropdownButtonRef}
      disabled={disabled}
      onPress={openDropdown}
      style={{
        ...styles.dropdownButton,
        ...(dropdownIconPosition == 'left' ? styles.row : styles.rowRevese),
        ...buttonStyle,
        justifyContent: onlyDropdownIcon ? 'center' : 'center',
      }}>
      {renderDropdown()}
      {renderDropdownIcon && renderDropdownIcon(isVisible)}
      {!onlyDropdownIcon &&
        (renderCustomizedButtonChild ? (
          <View style={styles.dropdownCustomizedButtonParent}>
            {renderCustomizedButtonChild(selectedItem, selectedIndex)}
          </View>
        ) : (
          <Text
            numberOfLines={textNumberOfLines}
            allowFontScaling={false}
            style={{...styles.dropdownButtonText, ...buttonTextStyle}}>
            {multipleSelect
              ? selectedItem.length > 0
                ? buttonTextAfterSelection
                : defaultButtonText
              : isExist(selectedItem)
              ? buttonTextAfterSelection
                ? buttonTextAfterSelection(selectedItem, selectedIndex)
                : selectedItem.toString()
              : defaultButtonText || 'Select an option.'}
          </Text>
        ))}
    </TouchableOpacity>
  );
};

export default forwardRef((props, ref) => SelectDropdown(props, ref));
