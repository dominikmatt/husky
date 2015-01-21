/**
 * @class TableView (Datagrid Decorator)
 * @constructor
 *
 * @param {Object} [viewOptions] Configuration object
 * @param {Boolean} [options.editable] will not set class is-selectable to prevent hover effect for complete rows
 * @param {Boolean} [options.removeRow] displays in the last column an icon to remove a row
 * @param {Object} [options.selectItem] Configuration object of select item (column)
 * @param {Boolean} [options.selectItem.inFirstCell] If true checkbox is in the first cell. If true checkbox gets its own cell
 * @param {String} [options.selectItem.type] Type of select [checkbox, radio]
 * @param {Boolean} [options.addRowTop] adds row to the top of the table when add row is triggered
 * @param {String} [options.fullWidth] If true datagrid style will be full-width mode
 * @param {Array} [options.excludeFields=['id']] array of fields to exclude by the view
 * @param {Boolean} [options.showHead] if TRUE head would be showed
 * @param {Array} [options.icons] array of icons to display
 * @param {String} [options.icons[].icon] the actual icon which sould be displayed
 * @param {String} [options.icons[].column] the id of the column in which the icon should be displayed
 * @param {String} [options.icons[].align] the align of the icon. 'left' org 'right'
 * @param {Function} [options.icons.callback] a callback to execute if the icon got clicked. Gets the id of the data-record as first argument
 * @param {Boolean} [options.hideChildrenAtBeginning] if true children get hidden, if all children are loaded at the beginning
 * @param {String|Number|Null} [options.openChildId] the id of the children to open all parents for. (only relevant in a child-list)
 * @param {String|Number} [options.cssClass] css-class to give the the components element. (e.g. "white-box")
 * @param {Boolean} [options.highlightSelected] highlights the clicked row when selected
 * @param {String} [options.removeIcon] icon to use for the remove-row item
 * @param {Number} [options.croppedMaxLength] the length to which croppable cells will be cropped on overflow
 * @param {Boolean} [options.stickyHeader] true to make the table header sticky
 * @param {Boolean} [options.openPathToSelectedChildren] true to show path to selected children
 *
 * @param {Boolean} [rendered] property used by the datagrid-main class
 * @param {Function} [initialize] function which gets called once at the start of the view
 * @param {Function} [render] function to render data
 * @param {Function} [destroy] function to destroy the view and unbind events
 * @param {Function} [onResize] function which gets automatically executed on window resize
 * @param {Function} [unbindCustomEvents] function to unbind the custom events of this object
 */
define(function() {

    'use strict';

    var defaults = {
        editable: false,
        fullWidth: false,
        removeRow: false,
        selectItem: {
            type: 'checkbox',
            inFirstCell: false
        },
        noItemsText: 'This list is empty',
        addRowTop: true,
        excludeFields: [''],
        cssClass: '',
        thumbnailFormat: '50x50',
        showHead: true,
        hideChildrenAtBeginning: true,
        openChildId: null,
        highlightSelected: false,
        stickyHeader: false,
        icons: [],
        removeIcon: 'trash-o',
        croppedMaxLength: 35,
        openPathToSelectedChildren: false
    },

    constants = {
        fullWidthClass: 'fullwidth',
        stickyHeaderClass: 'sticky-header',
        selectedRowClass: 'selected',
        isSelectableClass: 'is-selectable',
        sortableClass: 'is-sortable',
        skeletonClass: 'husky-table',
        containerClass: 'table-container',
        overflowClass: 'overflow',
        emptyListElementClass: 'empty-list',
        rowRemoverClass: 'row-remover',
        checkboxClass: 'checkbox',
        radioClass: 'radio',
        cellFitClass: 'fit',
        tableClass: 'table',
        rowClass: 'row',
        thumbSrcKey: 'url',
        thumbAltKey: 'alt',
        headerCellClass: 'header-cell',
        ascSortedClass: 'sorted-asc',
        descSortedClass: 'sorted-desc',
        headerCellLoaderClass: 'header-loader',
        headerLoadingClass: 'is-loading',
        editableItemClass: 'editable',
        editableInputClass: 'editable-input',
        inputWrapperClass: 'input-wrapper',
        editedErrorClass: 'server-validation-error',
        newRecordId: 'newrecord',
        gridIconClass: 'grid-icon',
        childWrapperClass: 'child-wrapper',
        parentClass: 'children-toggler',
        noChildrenClass: 'no-children',
        toggleIconClass: 'toggle-icon',
        collapsedIcon: 'fa-caret-right',
        expandedIcon: 'fa-caret-down',
        checkboxCellClass: 'checkbox-cell',
        textContainerClass: 'cell-content',
        renderingClass: 'rendering',
        headerCloneClass: 'header-clone',
        childIndent: 25 //px
    },

    selectItems = {
        CHECKBOX: 'checkbox',
        RADIO: 'radio'
    },

    /**
     * Templates used by this class
     */
    templates = {
        skeleton: [
            '<div class="'+ constants.skeletonClass +'">',
            '   <div class="'+ constants.containerClass +'"></div>',
            '</div>'
        ].join(''),
        table: '<table class="'+ constants.tableClass +'"></table>',
        header: '<thead></thead>',
        body: '<tbody></tbody>',
        row: '<tr class="' + constants.rowClass + '"></tr>',
        headerCell: '<th class="'+ constants.headerCellClass +'"></th>',
        cell: '<td></td>',
        textContainer: '<span class="'+ constants.textContainerClass +'"><%= content %></span>',
        headerCellLoader: '<div class="'+ constants.headerCellLoaderClass +'"></div>',
        removeCellContent: '<span class="fa-<%= icon %> '+ constants.rowRemoverClass +'"></span>',
        editableCellContent: [
            '<span class="'+ constants.editableItemClass +'"><%= value %></span>',
            '<div class="'+ constants.inputWrapperClass +'">',
            '   <input type="text" class="form-element husky-validate '+ constants.editableInputClass +'" value="<%= value %>">',
            '</div>'
        ].join(''),
        img: '<img alt="<%= alt %>" src="<%= src %>"/>',
        childWrapper: '<div class="'+ constants.childWrapperClass +'"></div>',
        toggleIcon: '<span class="'+ constants.toggleIconClass +'"></span>',
        icon: [
            '<span class="'+ constants.gridIconClass +' <%= align %>" data-icon-index="<%= index %>">',
            '   <span class="fa-<%= icon %>"></span>',
            '</span>'
        ].join(''),
        checkbox: [
            '<div class="custom-checkbox">',
            '   <input class="' + constants.checkboxClass + '" type="checkbox" data-form="false"/>',
            '   <span class="icon"></span>',
            '</div>'
        ].join(''),
        radio: [
            '<div class="custom-radio">',
            '    <input class="' + constants.radioClass + '" name="<%= name %>" type="radio" data-form="false"/>',
            '    <span class="icon"></span>',
            '</div>'
        ].join(''),
        empty: [
            '<div class="'+ constants.emptyListElementClass +'">',
            '   <div class="fa-coffee icon"></div>',
            '   <span><%= text %></span>',
            '</div>'
        ].join('')
    },

    /**
     * used to update the table width and its containers due to responsiveness
     * @event husky.datagrid.update.table
     */
    UPDATE_TABLE = function() {
        return this.datagrid.createEventName.call(this.datagrid, 'update.table');
    },

    /**
     * used to update the table width and its containers due to responsiveness
     * @event husky.datagrid.table.open-child
     * @param {Number|String} id The id of the data-record to open the parents for
     */
    OPEN_PARENTS = function() {
        return this.datagrid.createEventName.call(this.datagrid, 'table.open-parents');
    },

    /**
     * triggered when a radio button inside the datagrid is clicked
     * @event husky.datagrid.table.open-child
     * @param {Number|String} id The id of the data-record to open the parents for
     * @param {String} columnName column name
     */
    RADIO_SELECTED = function() {
        return this.datagrid.createEventName.call(this.datagrid, 'radio.selected');
    },

    /**
     * triggered when children were collapsed
     * @event husky.datagrid.table.children.collapsed
     */
    CHILDREN_COLLAPSED = function() {
        return this.datagrid.createEventName.call(this.datagrid, 'children.collapsed');
    },

    /**
     * triggered when children were expanded
     * @event husky.datagrid.table.children.expanded
     */
    CHILDREN_EXPANDED = function() {
        return this.datagrid.createEventName.call(this.datagrid, 'children.expanded');
    };

    return {

        /**
         * Public methods used by the main datagrid class (start)
         * -------------------------------------------------------------------- */

        /**
         * Initializes the view, gets called only once
         * @param {Object} context The context of the datagrid class
         * @param {Object} options The options used by the view
         */
        initialize: function(context, options) {
            // store context of the datagrid-component
            this.datagrid = context;

            // make sandbox available in this-context
            this.sandbox = this.datagrid.sandbox;

            // merge defaults with options
            this.options = this.sandbox.util.extend(true, {}, defaults, options);

            this.bindCustomEvents();
            this.setVariables();
        },

        /**
         * Binds custom related events
         */
        bindCustomEvents: function() {
            this.sandbox.on(UPDATE_TABLE.call(this), this.onResize.bind(this));
            this.sandbox.on(OPEN_PARENTS.call(this), this.openParents.bind(this));

            if(!!this.options.openPathToSelectedChildren){
                var eventName = '';
                if(!!this.datagrid.options.instanceName) {
                    eventName = 'husky.datagrid.'+this.datagrid.options.instanceName+'.view.rendered';
                } else {
                    eventName = 'husky.datagrid.view.rendered';
                }
                this.sandbox.on(eventName, this.openPathToSelectedChildren.bind(this));
            }
        },

        /**
         * Opens path to all selected children
         */
        openPathToSelectedChildren: function(){
            this.sandbox.util.each(this.datagrid.selectedItems, function(idx, id){
                this.openParents(id);
            }.bind(this));
        },

        /**
         * Unbinds custom events
         */
        unbindCustomEvents: function() {
            this.sandbox.off(UPDATE_TABLE.call(this), this.onResize.bind(this));
            this.sandbox.off(OPEN_PARENTS.call(this), this.openParents.bind(this));
        },

        /**
         * Method to render data in table view
         */
        render: function(data, $container) {
            this.$el = this.sandbox.dom.createElement(templates.skeleton);
            this.sandbox.dom.append($container, this.$el);
            this.addViewClasses();
            this.data = data;
            this.renderTable();
            this.bindDomEvents();
            if (this.datagrid.options.resizeListeners === true) {
                this.onResize();
            }
            if (!!this.options.openChildId) {
                this.openParents(this.options.openChildId);
                this.options.openChildId = null;
            }
            this.renderChildrenHidden = false;
            this.sandbox.dom.removeClass(this.$el, constants.renderingClass);
            this.rendered = true;
        },

        /**
         * Destroys the view
         */
        destroy: function() {
            this.sandbox.stop(this.sandbox.dom.find('*', this.$el));
            this.sandbox.dom.remove(this.$el);
            this.setVariables();
        },

        /**
         * Adds a row to the datagrid
         * @param record {Object} the new record to add
         */
        addRecord: function (record) {
            this.removeEmptyIndicator();
            this.renderBodyRow(record, this.options.addRowTop);
        },

        /**
         * Removes a record from the view
         * @param recordId {Number|String}
         */
        removeRecord: function(recordId) {
            this.datagrid.removeRecord.call(this.datagrid, recordId);
            this.sandbox.dom.remove(this.table.rows[recordId].$el);
            delete this.table.rows[recordId];
            if (Object.keys(this.table.rows).length === 0) {
                this.toggleSelectAllItem(false);
                this.renderEmptyIndicator();
            }
        },

        /**
         * Handles the responsiveness
         */
        onResize: function() {
            if (this.containerIsOverflown() === true) {
                this.overflowHandler();
            } else {
                this.underflowHandler();
            }
            if (this.options.stickyHeader === true) {
                this.setHeaderCellWidthFromClone();
                this.fixContainerMaxHeight();
            }
        },

        /**
         * Public methods used by the main datagrid class (end)
         * -------------------------------------------------------------------- */

        /**
         * Sets the components starting properties
         */
        setVariables: function() {
            this.rendered = false;
            this.$el = null;
            this.table = {};
            this.data = null;
            this.rowClicked = false;
            this.isFocusoutHandlerEnabled = this.options.editable === true || this.options.editable === 'true';
            this.renderChildrenHidden = this.options.hideChildrenAtBeginning;
            this.tableCropped = false;
            this.cropBreakPoint = null;
        },

        /**
         * Adds css classes to the view element
         */
        addViewClasses: function () {
            this.sandbox.dom.addClass(this.$el, this.options.cssClass);
            this.sandbox.dom.addClass(this.$el, constants.renderingClass);
            if (this.options.stickyHeader === true) {
                this.sandbox.dom.addClass(this.$el, constants.stickyHeaderClass);
            }
            if (this.options.fullWidth === true) {
                this.sandbox.dom.addClass(this.$el, constants.fullWidthClass);
            }
            if ((this.options.highlightSelected === true || !!this.options.selectItem) && this.options.editable !== true) {
                this.sandbox.dom.addClass(this.$el, constants.isSelectableClass);
            }
        },

        /**
         * Render methods (start)
         * -------------------------------------------------------------------- */

        /**
         * Renders the table
         */
        renderTable: function() {
            this.table.$el = this.sandbox.dom.createElement(templates.table);
            this.table.$container = this.sandbox.dom.find('.' + constants.containerClass, this.$el);
            if (this.options.showHead === true) {
                this.renderHeader();
            }
            this.renderBody();
            this.sandbox.dom.append(this.table.$container, this.table.$el);
        },

        /**
         * Renders the table header
         */
        renderHeader: function() {
            this.table.header = {};
            this.table.header.$el = this.sandbox.dom.createElement(templates.header);
            this.table.header.$row = this.sandbox.dom.createElement(templates.row);
            this.sandbox.dom.append(this.table.header.$el, this.table.header.$row);
            this.renderHeaderSelectItem();
            this.renderHeaderCells();
            this.renderHeaderRemoveItem();
            if (this.options.stickyHeader === true) {
                this.cloneHeader();
            }
            this.sandbox.dom.append(this.table.$el, this.table.header.$el);
        },

        /**
         * Creates a clone for the actual header
         */
        cloneHeader: function() {
            this.table.header.$clone = this.sandbox.dom.clone(this.table.header.$el);
            this.sandbox.dom.addClass(this.table.header.$clone, constants.headerCloneClass);
            this.sandbox.dom.append(this.table.$el, this.table.header.$clone);
        },

        /**
         * Renders the select-all checkbox of the header
         */
        renderHeaderSelectItem: function() {
            if (!!this.options.selectItem && !!this.options.selectItem.type) {
                var $cell = this.sandbox.dom.createElement(templates.headerCell);
                this.sandbox.dom.addClass($cell, constants.checkboxCellClass);
                if (this.options.selectItem.type === selectItems.CHECKBOX) {
                    this.sandbox.dom.html($cell, templates.checkbox);
                }
                this.sandbox.dom.prepend(this.table.header.$row, $cell);
            }
        },

        /**
         * Renderes the cells in the header
         */
        renderHeaderCells: function() {
            var $headerCell;
            this.table.header.cells = {};

            this.sandbox.util.foreach(this.datagrid.matchings, function(column) {
                $headerCell = this.sandbox.dom.createElement(templates.headerCell);
                this.sandbox.dom.html($headerCell, this.sandbox.util.template(templates.textContainer)({
                    content: this.sandbox.translate(column.content)
                }));
                this.sandbox.dom.data($headerCell, 'attribute', column.attribute);
                this.table.header.cells[column.attribute] = {
                    $el: $headerCell,
                    sortable: column.sortable
                };
                this.sandbox.dom.append(this.table.header.$row, this.table.header.cells[column.attribute].$el);
                this.setHeaderCellClasses(column.attribute);
            }.bind(this));
        },

        /**
         * Sets css classes on a header cell
         * @param column {String} the column attribute of the column to set the classes for
         */
        setHeaderCellClasses: function(column) {
            if (this.datagrid.options.sortable === true) {
                var $element = this.table.header.cells[column].$el,
                    sortedClass;
                if (this.table.header.cells[column].sortable === true) {
                    this.sandbox.dom.addClass($element, constants.sortableClass);
                    if (column === this.datagrid.sort.attribute) {
                        sortedClass = (this.datagrid.sort.direction === 'asc') ? constants.ascSortedClass : constants.descSortedClass;
                        this.sandbox.dom.addClass($element, sortedClass);
                    }
                }
            }
        },

        /**
         * Renderes an empty remove-row cell into the header
         */
        renderHeaderRemoveItem: function () {
            if (this.options.removeRow === true) {
                var $cell = this.sandbox.dom.createElement(templates.headerCell);
                this.sandbox.dom.addClass($cell, constants.cellFitClass);
                this.sandbox.dom.append(this.table.header.$row, $cell);
            }
        },

        /**
         * Renders the table body
         */
        renderBody: function() {
            this.table.$body = this.sandbox.dom.createElement(templates.body);
            this.table.rows = {};
            if (this.data.embedded.length > 0) {
                this.sandbox.util.foreach(this.data.embedded, function(record) {
                    this.renderBodyRow(record, false);
                }.bind(this));
            } else {
                this.renderEmptyIndicator();
            }
            this.sandbox.dom.append(this.table.$el, this.table.$body);
        },

        /**
         * Renders the checkbox or radio button for a row in the tbody
         * @param id {Number|String} the id of the row to add the select-item for
         * @param norender {Boolean} if true the select-item doesn't get rendered as a cell but returned as string
         * @returns {String} html if no render is set to true
         */
        renderRowSelectItem: function(id, norender) {
            if (this.datagrid.options.onlySelectLeaves === true && !!this.table.rows[id].hasChildren) {
                return '';
            }
            if (!!this.options.selectItem && !!this.options.selectItem.type &&
                (this.options.selectItem.inFirstCell === false || norender === true)) {
                var $cell = this.sandbox.dom.createElement(templates.cell);
                this.sandbox.dom.addClass($cell, constants.cellFitClass);
                if (this.options.selectItem.type === selectItems.CHECKBOX) {
                    this.sandbox.dom.html($cell, templates.checkbox);
                } else if (this.options.selectItem.type === selectItems.RADIO) {
                    this.sandbox.dom.html($cell, this.sandbox.util.template(templates.radio)({
                        name: 'datagrid-' + this.datagrid.options.instanceName
                    }));
                }
                if (norender === true) {
                    return this.sandbox.dom.html($cell);
                }
                this.sandbox.dom.prepend(this.table.rows[id].$el, $cell);
            }
        },

        /**
         * Renderes a single table row. If the row already exists it replaces the exiting one
         * @param record {Object} the record
         * @param prepend {Boolean} if true row gets prepended
         */
        renderBodyRow: function(record, prepend) {
            this.removeNewRecordRow();

            if (!this.table.rows[record.id]) {
                var $row = this.sandbox.dom.createElement(templates.row),
                    $overrideElement = (!!this.table.rows[record.id]) ? this.table.rows[record.id].$el : null;

                record.id = (!!record.id) ? record.id : constants.newRecordId;
                this.sandbox.dom.data($row, 'id', record.id);

                if (!!record.parent) {
                    if (!this.table.rows[record.parent]) {
                        this.renderBodyRow(this.data.embedded[this.datagrid.getRecordIndexById(record.parent)], prepend);
                    }
                    this.table.rows[record.parent].childrenLoaded = true;
                }

                this.table.rows[record.id] = {
                    $el: $row,
                    cells: {},
                    childrenLoaded: !!this.table.rows[record.id] ? this.table.rows[record.id].childrenLoaded : false,
                    childrenExpanded: false,
                    parent: !!(record.parent) ? record.parent : null,
                    hasChildren: (!!record[this.datagrid.options.childrenPropertyName]) ? record[this.datagrid.options.childrenPropertyName] : false,
                    level: 1
                };
                this.renderRowSelectItem(record.id);
                this.renderBodyCellsForRow(record);
                this.renderRowRemoveItem(record.id);

                this.insertBodyRow(record, $overrideElement, prepend);
                this.executeRowPostRenderActions(record);
            }
        },

        /**
         * Inserts a body row into the dom. Looks if a row needs to be overridden, or if a parent exists etc.
         * @param record {Object} the data object of the record
         * @param $overrideElement {Object}
         * @param prepend {Boolean} true to prepend
         */
        insertBodyRow: function(record, $overrideElement, prepend) {
            var $parentElement = (!!this.table.rows[record.parent]) ? this.table.rows[record.parent].$el : null,
                insertMethod = (prepend === true) ? this.sandbox.dom.prepend : this.sandbox.dom.append;

            // if there already was a row with the same id, override it with the new one
            if (!!$overrideElement && !!$overrideElement.length) {
                this.sandbox.dom.after($overrideElement, this.table.rows[record.id].$el);
                this.sandbox.dom.remove($overrideElement);
                // if there is a parent insert it after the parent row
            } else if (!!$parentElement && !!$parentElement.length) {
                if (this.renderChildrenHidden === true) {
                    this.sandbox.dom.hide(this.table.rows[record.id].$el);
                    this.changeChildrenToggleIcon(record.parent, false);
                } else {
                    this.table.rows[record.parent].childrenExpanded = true;
                    this.changeChildrenToggleIcon(record.parent, true);
                }
                this.sandbox.dom.after($parentElement, this.table.rows[record.id].$el);
                // else just append or prepend it
            } else {
                insertMethod(this.table.$body, this.table.rows[record.id].$el);
            }
        },

        /**
         * Manipulates a row of a rendered after it has been rendered. For examples checks the checkbox or focuses an input
         * @param record {Object} the data of the record
         */
        executeRowPostRenderActions: function(record) {
            if (!!this.datagrid.itemIsSelected.call(this.datagrid, record.id)) {
                this.toggleSelectRecord(record.id, true);
            } else {
                this.toggleSelectAllItem(false);
            }
            // select first input if record is new and editable is true
            if (this.options.editable === true && record.id === constants.newRecordId) {
                this.showInput(record.id);
            }
        },

        /**
         * Renderes the all the content cells in a body row
         * @param record {Object} the data for the row
         */
        renderBodyCellsForRow: function(record) {
            // foreach matching grab the corresponding data and render the cell with it
            this.sandbox.util.foreach(this.datagrid.matchings, function(column, index) {
                if (this.options.excludeFields.indexOf(column.attribute) === -1) {
                    this.renderBodyCell(record, column, index);
                }
            }.bind(this));
        },

        /**
         * Renders the remove item for a row in the tbody
         * @param id {Number|String} the id of the row to add the select-item for
         */
        renderRowRemoveItem: function (id) {
            if (this.options.removeRow === true) {
                var $cell = this.sandbox.dom.createElement(templates.cell);
                this.sandbox.dom.html($cell, this.sandbox.util.template(templates.removeCellContent)({
                    icon: this.options.removeIcon
                }));
                this.sandbox.dom.addClass($cell, constants.cellFitClass);
                this.sandbox.dom.append(this.table.rows[id].$el, $cell);
            }
        },

        /**
         * Renders a single cell
         * @param record {Object} the record to render the cell for
         * @param column {Object} the column which should be rendered
         * @param index {Number} the index of the cell in the row
         */
        renderBodyCell: function(record, column, index) {
            var $cell = this.sandbox.dom.createElement(templates.cell),
                content = this.getCellContent(record, column),
                selectItem, isCroppable = false;
            if (!!this.datagrid.options.childrenPropertyName && index === 0) {
                content = this.wrapChildrenCellContent(content, record);
            }
            if (!!this.options.selectItem && this.options.selectItem.inFirstCell === true && index === 0) {
                this.sandbox.dom.attr($cell, 'colspan', 2);
                selectItem = this.renderRowSelectItem(record.id, true);
                if (typeof content === 'string') {
                    content = selectItem + content;
                } else {
                    this.sandbox.dom.prepend(content, selectItem);
                }
            }
            this.sandbox.dom.html($cell, content);
            this.sandbox.dom.data($cell, 'attribute', column.attribute);

            if (!!this.sandbox.dom.find('.' + constants.textContainerClass, $cell).length &&
                this.sandbox.dom.children(this.sandbox.dom.find('.' + constants.textContainerClass, $cell)).length === 0) {
                isCroppable = true;
            }

            this.table.rows[record.id].cells[column.attribute] = {
                $el: $cell,
                originalData: record[column.attribute],
                originalContent: this.sandbox.dom.html(content),
                editable: !!column.editable,
                croppable: isCroppable
            };
            // append cell to corresponding row
            this.sandbox.dom.append(
                this.table.rows[record.id].$el,
                this.table.rows[record.id].cells[column.attribute].$el
            );
        },

        /**
         * Gets the actual content for a cell
         * @param record {Object} the record to get the content for
         * @param column {Object} the column for which the content should be returned
         * @returns {String|Object} the dom object for the cell content or html
         */
        getCellContent: function(record, column) {
            var content = record[column.attribute];
            if (!!column.type && column.type === this.datagrid.types.THUMBNAILS) {
                content = this.datagrid.manipulateContent(content, column.type, this.options.thumbnailFormat);
                content = this.sandbox.util.template(templates.img)({
                   alt: content[constants.thumbAltKey],
                   src: content[constants.thumbSrcKey]
                });
            } else {
                content = this.datagrid.processContentFilter(
                    column.attribute,
                    content,
                    column.type,
                    Object.keys(this.table.rows).length,
                    record.hasOwnProperty('id') ? record['id'] : null
                );
            }
            if (this.options.editable === true && column.editable === true) {
                content = this.getEditableCellContent(content);
            } else {
                content = this.sandbox.util.template(templates.textContainer)({
                    content: content
                });
            }
            if (!!this.options.icons) {
                content = this.addIconsToCellContent(content, column);
            }
            return content;
        },

        /**
         * Wraps content into an additional container an indent and a toggler icon (for children and parents)
         * @param content {String|Object} the content to wrap. html or dom object
         * @param record {Object} the record data object
         */
        wrapChildrenCellContent: function(content, record) {
            var $wrappedContent = this.sandbox.dom.createElement(templates.childWrapper),
                $icon;
            // if has children
            if (!!record[this.datagrid.options.childrenPropertyName]) {
                this.sandbox.dom.addClass($wrappedContent, constants.parentClass);
                $icon = this.sandbox.dom.createElement(templates.toggleIcon);
                this.sandbox.dom.prependClass($icon, constants.collapsedIcon);
                this.sandbox.dom.prepend($wrappedContent, $icon);
            } else {
                this.sandbox.dom.addClass($wrappedContent, constants.noChildrenClass);
            }
            // if has parent
            if (!!record.parent) {
                this.table.rows[record.id].level = this.table.rows[record.parent].level + 1;
                // give that child an indent, children love indents
                this.sandbox.dom.css($wrappedContent, {
                    'padding-left': constants.childIndent * (this.table.rows[record.id].level - 1) + 'px'
                });
            }
            this.sandbox.dom.append($wrappedContent, content);
            return $wrappedContent;
        },

        /**
         * Takes a string and retruns the markup for an editable cell
         * @param content {String} the original value
         * @returns {String|Object} html or a dom object
         */
        getEditableCellContent: function(content) {
            var returnHTML = this.sandbox.util.template(templates.editableCellContent)({
                value: content
            });
            return returnHTML;
        },

        /**
         * Adds icons to a cell content
         * @param content {String|Object} html or a dom object. If its a string icons get added to the string, if its an object it gets appended
         * @param column {Object} the column data object
         * @returns content {String|Object} html or a dom object
         */
        addIconsToCellContent: function(content, column) {
            var iconStr;
            this.sandbox.util.foreach(this.options.icons, function(icon, index) {
                if (icon.column === column.attribute) {
                    iconStr = this.sandbox.util.template(templates.icon)({
                       icon: icon.icon,
                       align: icon.align,
                       index: index
                    });
                    if (typeof content === 'object') {
                        this.sandbox.dom.append(content, iconStr);
                    } else if (typeof content === 'string') {
                        content += iconStr;
                    }
                }
            }.bind(this));
            return content;
        },

        /**
         * Renders the empty list element
         */
        renderEmptyIndicator: function() {
            this.sandbox.dom.append(this.$el, this.sandbox.util.template(templates.empty)({
                text: this.sandbox.translate(this.options.noItemsText)
            }));
        },

        /**
         * Removes the "new" record row
         */
        removeNewRecordRow: function() {
            if (!!this.table.rows[constants.newRecordId]) {
                this.sandbox.dom.remove(this.table.rows[constants.newRecordId].$el);
                delete this.table.rows[constants.newRecordId];
            }
        },

        /**
         * Render methods (end)
         * -------------------------------------------------------------------- */

        /**
         * Returns true or false whether the container is overflown or not
         * @returns {boolean}
         */
        containerIsOverflown: function() {
            return this.sandbox.dom.get(this.table.$container, 0).scrollWidth > this.sandbox.dom.width(this.table.$container);
        },

        /**
         * Gets executed when the table width is bigger than its container width
         */
        overflowHandler: function() {
            this.toggleCropTable(true);
            // if still overflown add a css class
            if (this.containerIsOverflown() === true) {
                this.sandbox.dom.addClass(this.$el, constants.overflowClass);
            }
            if (this.options.stickyHeader === true) {
                this.sandbox.dom.width(this.table.header.$el, this.sandbox.dom.width(this.table.$container));
            }
        },

        /**
         * Gets executed when the table width is not bigger than its container width
         */
        underflowHandler: function() {
            if (this.tableCropped === true) {
                if (this.sandbox.dom.width(this.table.$container) > this.cropBreakPoint) {
                    this.toggleCropTable(false);
                }
                if (this.containerIsOverflown() === false) {
                    this.sandbox.dom.removeClass(this.$el, constants.overflowClass);
                }
                if (this.options.stickyHeader === true) {
                    this.sandbox.dom.width(this.table.header.$el, '');
                }
            }
        },

        /**
         * Crops or uncropps all croppable cells in the table
         */
        toggleCropTable: function(crop) {
            if (this.tableCropped !== crop) {
                var $contentContainer,
                    content;
                this.sandbox.util.each(this.table.rows, function(rowId, row) {
                    this.sandbox.util.each(row.cells, function(cellId, cell) {
                        if (cell.croppable === true) {
                            $contentContainer = this.sandbox.dom.find('.' + constants.textContainerClass, cell.$el);
                            if (crop === true) {
                                content = this.sandbox.util.cropMiddle(cell.originalContent, this.options.croppedMaxLength);
                                this.sandbox.dom.attr($contentContainer, 'title', cell.originalContent);
                                this.tableCropped = true;
                                this.cropBreakPoint = this.sandbox.dom.width(this.table.$container);
                            } else {
                                content = cell.originalContent;
                                this.sandbox.dom.removeAttr($contentContainer, 'title');
                                this.tableCropped = false;
                            }
                            this.sandbox.dom.html($contentContainer, content);
                        }
                    }.bind(this));
                }.bind(this));
            }
        },

        /**
         * Bindes dom related events
         */
        bindDomEvents: function () {
            // select or deselect items if the body recognizes a change event
            this.sandbox.dom.on(
                this.table.$body, 'click', this.selectItemChangeHandler.bind(this),
                '.' + constants.checkboxClass + ', .' + constants.radioClass
            );
            // handle click on body row
            this.sandbox.dom.on(this.table.$body, 'click', this.bodyRowClickHandler.bind(this), '.' + constants.rowClass);
            // remove row event
            if (this.options.removeRow === true) {
                this.sandbox.dom.on(this.table.$body, 'click', this.removeItemClickHandler.bind(this), '.' + constants.rowRemoverClass);
            }
            if (!!this.table.header) {
                // select all
                this.sandbox.dom.on(this.table.header.$el, 'change', this.allSelectItemChangeHandler.bind(this));

                // click on sortable item
                if (this.datagrid.options.sortable === true) {
                    this.sandbox.dom.on(
                        this.table.header.$el, 'click', this.sortItemClickHandler.bind(this),
                        '.' + constants.headerCellClass + '.' + constants.sortableClass
                    );
                }
            }
            // click on editable item
            if (this.options.editable === true) {
                this.sandbox.dom.on(this.table.$body, 'click', this.editableItemClickHandler.bind(this), '.' + constants.editableItemClass);
                this.sandbox.dom.on(this.table.$body, 'focusout', this.editableInputFocusoutHandler.bind(this), '.' + constants.editableInputClass);
                this.sandbox.dom.on(this.table.$body, 'keypress', this.editableInputKeyHandler.bind(this), '.' + constants.editableInputClass);
            }
            if (!!this.options.icons) {
                this.sandbox.dom.on(this.table.$body, 'click', this.iconClickHandler.bind(this), '.' + constants.gridIconClass);
            }
            this.sandbox.dom.on(this.table.$container, 'scroll', this.containerScrollHandler.bind(this));
            this.sandbox.dom.on(this.table.$body, 'click', this.radioButtonClickHandler.bind(this), 'input[type="radio"]');
        },

        /**
         * Gets the width of the cells in the header clone and applies them to the actual header
         */
        setHeaderCellWidthFromClone: function() {
            if (!!this.table.header && !!this.table.header.$clone.length) {
                var cloneThs = this.sandbox.dom.find('th', this.table.header.$clone),
                    originalThs = this.sandbox.dom.find('th', this.table.header.$el);
                this.sandbox.dom.width(this.table.header.$row, this.sandbox.dom.width(
                   this.sandbox.dom.find('tr', this.table.header.$clone)
                ));
                this.sandbox.util.foreach(cloneThs, function(cloneTh, index) {
                    // min- and max-width because for table-cells normal width has no effect
                    this.sandbox.dom.css(originalThs[index], {
                        'min-width': this.sandbox.dom.outerWidth(cloneTh) + 'px',
                        'max-width': this.sandbox.dom.outerWidth(cloneTh) + 'px'
                    });
                }.bind(this));
            }
        },

        /**
         * Sets the max-height of the container to the maximum available space
         */
        fixContainerMaxHeight: function() {
            this.sandbox.dom.css(this.table.$container, 'max-height', this.datagrid.getRemainingViewHeight.call(this.datagrid));
        },

        /**
         * Gets executed when the table-container gets scrolled
         */
        containerScrollHandler: function() {
            if (this.options.stickyHeader === true) {
                this.sandbox.dom.scrollLeft(this.table.header.$el, this.sandbox.dom.scrollLeft(this.table.$container));
            }
        },

        /**
         * Gets executed if a radio button in the table body gets clicked
         * @param event
         */
        radioButtonClickHandler: function(event) {
            this.sandbox.dom.stopPropagation(event);
            var recordId = this.sandbox.dom.data(this.sandbox.dom.parents(event.currentTarget, '.' + constants.rowClass), 'id'),
                attribute = this.sandbox.dom.data(this.sandbox.dom.parents(event.currentTarget, 'td'), 'attribute');
            this.sandbox.emit(RADIO_SELECTED.call(this), recordId, attribute);
        },

        /**
         * Handles the click on grid-icons
         * @param event {Object} the event object
         */
        iconClickHandler: function(event) {
            event.stopPropagation();
            var icon = this.options.icons[this.sandbox.dom.data(event.currentTarget, 'icon-index')],
                recordId = this.sandbox.dom.data(this.sandbox.dom.parents(event.currentTarget, '.' + constants.rowClass), 'id');
            if (typeof recordId !== 'undefined' && !!icon && typeof icon.callback === 'function') {
                icon.callback(recordId);
            }
        },

        /**
         * Handles the click on a sortable item
         * @param event {Object} the event object
         */
        sortItemClickHandler: function(event) {
            this.sandbox.dom.stopPropagation(event);
            var attribute = this.sandbox.dom.data(event.currentTarget, 'attribute'),
                direction = 'asc';
            if (this.datagrid.sort.attribute === attribute && this.datagrid.sort.direction === direction) {
                direction = 'desc';
            }
            this.startHeaderCellLoader(attribute);
            // delegate sorting to datagrid
            this.datagrid.sortGrid.call(this.datagrid, attribute, direction);
        },

        /**
         * Handles the click on an editable item
         * @param event {Object} the event object
         */
        editableItemClickHandler: function(event) {
            this.sandbox.dom.stopPropagation(event);
            var recordId = this.sandbox.dom.data(this.sandbox.dom.parents(event.currentTarget, '.' + constants.rowClass), 'id'),
                attribute = this.sandbox.dom.data(this.sandbox.dom.parents(event.currentTarget, 'td'), 'attribute');
            this.showInput(recordId, attribute);
        },

        /**
         * Shows a edit-input for a row and an attribute if no attribute passed shows the first input in row
         * @param recordId {Number|String}
         * @param attribute {String}
         */
        showInput: function(recordId, attribute) {
            var $cell, $inputs;
            if (!attribute) {
                $inputs = this.sandbox.dom.find('.' + constants.editableInputClass, this.table.rows[recordId].$el);
                attribute = this.sandbox.dom.data(this.sandbox.dom.parents($inputs[0], 'td'), 'attribute');
            }
            $cell = this.table.rows[recordId].cells[attribute].$el;
            this.sandbox.dom.show(this.sandbox.dom.find('.' + constants.inputWrapperClass, $cell));
            this.sandbox.dom.focus(this.sandbox.dom.find('.' + constants.editableInputClass, $cell));
            this.sandbox.dom.select(this.sandbox.dom.find('.' + constants.editableInputClass, $cell));
        },

        /**
         * Handles keypress events of the editable inputs
         * @param event {Object} the event object
         */
        editableInputKeyHandler: function(event) {
            var recordId;
            // on enter
            if (event.keyCode === 13) {
                this.sandbox.dom.stopPropagation(event);
                recordId = this.sandbox.dom.data(this.sandbox.dom.parents(event.currentTarget, '.' + constants.rowClass), 'id');
                this.editRow(recordId);
            }
        },

        /**
         * Handles the focusout of an editable input
         * @param event {Object} the event object
         */
        editableInputFocusoutHandler: function (event) {
            if (!!this.isFocusoutHandlerEnabled) {
                this.sandbox.dom.stopPropagation(event);
                var recordId = this.sandbox.dom.data(this.sandbox.dom.parents(event.currentTarget, '.' + constants.rowClass), 'id');
                this.editRow(recordId);
            }
        },

        /**
         * Gets the data of all edit-inputs in a row and saves their values
         * @param recordId {String|Number} the id of the row to edit
         */
        editRow: function(recordId) {
            var modifiedRecord = {};
            // build new record object out of the inputs in the row
            this.sandbox.util.each(this.table.rows[recordId].cells, function (attribute, cell) {
                if (!!this.sandbox.dom.find('.' + constants.editableInputClass, cell.$el).length) {
                    modifiedRecord[attribute] = this.sandbox.dom.val(
                        this.sandbox.dom.find('.' + constants.editableInputClass, cell.$el)
                    );
                }
            }.bind(this));
            this.saveRow(recordId, modifiedRecord, this.editedSuccessCallback.bind(this), this.editedErrorCallback.bind(this, recordId));
        },

        /**
         * Clears everything up after a row was edited. (hides the input and updates the values)
         * @param record {Object} the changed data record
         */
        editedSuccessCallback: function (record) {
            var $row;
            if (!!record.id && !!this.table.rows[record.id]) {
                $row = this.table.rows[record.id].$el;
            } else if (!!this.table.rows[constants.newRecordId]) {
                $row = this.table.rows[constants.newRecordId].$el;
            }
            if (!!$row && !!$row.length) {
                this.sandbox.dom.hide(this.sandbox.dom.find('.' + constants.inputWrapperClass, $row));
                this.renderBodyRow(record, this.options.addRowTop);
            }
        },

        /**
         * Adds a css class to all inputs in a row, if the editing request returned with an error
         * @param recordId
         */
        editedErrorCallback: function (recordId) {
            var $row = this.table.rows[recordId].$el;
            this.sandbox.dom.addClass(
                this.sandbox.dom.find('.' + constants.inputWrapperClass, $row),
                constants.editedErrorClass
            );
        },

        /**
         * Replaces a record with an existing one and sends it to a server
         * @param recordId {Number|String} the id of the record to override
         * @param newRecordData {Object} the new record data
         * @param successCallback {Function} gets executed after success
         * @param errorCallback {Function} gets executed after error
         */
        saveRow: function (recordId, newRecordData, successCallback, errorCallback) {
            var hasChanged = false,
                record;
            this.sandbox.util.each(this.table.rows[recordId].cells, function (attribute, cell) {
                if (cell.editable === true && cell.originalData !== newRecordData[attribute]) {
                    hasChanged = true;
                }
            }.bind(this));
            // merge record data
            record = this.sandbox.util.extend(
                true, {}, this.data.embedded[this.datagrid.getRecordIndexById(recordId)], newRecordData
            );
            if (recordId === constants.newRecordId) {
                delete record.id;
            }
            if (hasChanged === true) {
                // pass data to datagrid to save it
                this.datagrid.saveGrid.call(this.datagrid,
                    record, this.datagrid.getUrlWithoutParams.call(this.datagrid),
                    successCallback, errorCallback, this.options.addRowTop);
            } else {
                typeof successCallback === 'function' && successCallback(record);
            }
        },

        /**
         * Starts a loader in a cell in the header
         * @param column {String} the attribute of the header cell to insert the loader in
         */
        startHeaderCellLoader: function(column) {
            var $container = this.sandbox.dom.createElement(templates.headerCellLoader);
            this.sandbox.dom.addClass(this.table.header.cells[column].$el, constants.headerLoadingClass);
            this.sandbox.dom.append(this.sandbox.dom.find('.' + constants.textContainerClass, this.table.header.cells[column].$el), $container);
            this.sandbox.start([
                {
                    name: 'loader@husky',
                    options: {
                        el: $container,
                        size: '10px',
                        color: '#999999'
                    }
                }
            ]);
        },

        /**
         * Handles the click on a body row
         * @param event {Object} the event object
         */
        bodyRowClickHandler: function (event) {
            this.sandbox.dom.stopPropagation(event);
            var recordId = this.sandbox.dom.data(event.currentTarget, 'id');
            this.emitRowClickedEvent(event);
            if (!!recordId && !!this.table.rows[recordId]) {
                if (this.options.highlightSelected === true) {
                    this.uniqueHighlightRecord(recordId);
                }
                if (!!this.table.rows[recordId].hasChildren) {
                    this.toggleChildren(recordId);
                }
            }
        },

        /**
         * Emits the row clicked event
         * @param event {Object} the original click event
         */
        emitRowClickedEvent: function (event) {
            if (this.rowClicked === false) {
                this.rowClicked = true;
                var recordId = this.sandbox.dom.data(event.currentTarget, 'id'),
                    parameter = recordId || event;
                this.datagrid.emitItemClickedEvent.call(this.datagrid, parameter);
                // delay to prevent multiple emits on double click
                this.sandbox.util.delay(function () {
                    this.rowClicked = false;
                }.bind(this), 500);
            }
        },

        /**
         * Handles the click on the remove item
         * @param event {Object} the event object
         */
        removeItemClickHandler: function(event) {
            this.sandbox.dom.stopPropagation(event);
            var recordId = this.sandbox.dom.data(this.sandbox.dom.parents(event.currentTarget, '.' + constants.rowClass), 'id');
            this.removeRecord(recordId);
        },

        /**
         * Handles the change event of the select items
         * @param event {Object} the event object
         */
        selectItemChangeHandler: function (event) {
            this.sandbox.dom.stopPropagation(event);
            var recordId = this.sandbox.dom.data(this.sandbox.dom.parents(event.target, '.' + constants.rowClass), 'id'),
                isChecked = this.sandbox.dom.is(event.target, ':checked');
            if (this.options.selectItem.type === selectItems.CHECKBOX) {
                this.toggleSelectRecord(recordId, isChecked);
            } else if (this.options.selectItem.type === selectItems.RADIO) {
                this.uniqueSelectRecord(recordId);
            }
        },

        /**
         * Handles the change event of a select item in the header
         * @param event {Object} the event object
         */
        allSelectItemChangeHandler: function (event) {
            this.sandbox.dom.stopPropagation(event);
            var isChecked = this.sandbox.dom.is(event.target, ':checked');
            if (isChecked === true) {
                this.selectAllRecords();
            } else {
                this.deselectAllRecords();
            }
        },

        /**
         * Highlights a record an unhighlights all other rows
         * @param id {Number|String} the id of the record to highlight
         */
        uniqueHighlightRecord: function (id) {
            this.sandbox.dom.removeClass(
                this.sandbox.dom.find('.' + constants.rowClass + '.' + constants.selectedRowClass, this.table.$body),
                constants.selectedRowClass
            );
            this.sandbox.dom.addClass(this.table.rows[id].$el, constants.selectedRowClass);
        },

        /**
         * Selejcts all records
         */
        selectAllRecords: function () {
            this.datagrid.selectAllItems.call(this.datagrid);
            this.sandbox.dom.prop(this.sandbox.dom.find('.' + constants.checkboxClass, this.table.$body), 'checked', true);
        },

        /**
         * Deselects all records
         */
        deselectAllRecords: function () {
            this.datagrid.deselectAllItems.call(this.datagrid);
            this.sandbox.dom.prop(this.sandbox.dom.find('.' + constants.checkboxClass, this.table.$body), 'checked', false);
        },

        /**
         * Selects or deselects a record with a given id
         * @param id {Number|String} the id of the record to select or deselect
         * @param select {Boolean} true to select false to deselect
         */
        toggleSelectRecord: function (id, select) {
            var areAllSelected;
            if (select === true) {
                this.datagrid.setItemSelected.call(this.datagrid, id);
                // ensure that checkboxes are checked
                this.sandbox.dom.prop(
                    this.sandbox.dom.find('.' + constants.checkboxClass, this.table.rows[id].$el), 'checked', true
                );
            } else {
                this.datagrid.setItemUnselected.call(this.datagrid, id);
                // ensure that checkboxes are unchecked
                this.sandbox.dom.prop(
                    this.sandbox.dom.find('.' + constants.checkboxClass, this.table.rows[id].$el), 'checked', false
                );
            }
            // check or uncheck checkboxes in the header
            if (!!this.table.header) {
                areAllSelected = this.datagrid.getSelectedItemIds.call(this.datagrid).length === this.data.embedded.length;
                this.toggleSelectAllItem(areAllSelected);
            }
        },

        /**
         * Selects or deselects the select all item
         * @param select {Boolean} true to select false to deselect the select all item
         */
        toggleSelectAllItem: function (select) {
            if (!!this.table.header) {
                this.sandbox.dom.prop(
                    this.sandbox.dom.find('.' + constants.checkboxClass, this.table.header.$el), 'checked', select
                );
            }
        },

        /**
         * Selects a record and deselects all other records
         * @param id {Number|String} the id of the record to select
         */
        uniqueSelectRecord: function (id) {
            this.datagrid.deselectAllItems.call(this.datagrid);
            this.datagrid.setItemSelected.call(this.datagrid, id);
        },

        /**
         * Removes the empty list element
         */
        removeEmptyIndicator: function() {
            this.sandbox.dom.remove(this.sandbox.dom.find('.' + constants.emptyListElementClass, this.$el));
        },

        /**
         * Changes the toggle-icon of a parent row
         * @param recordId {String|Number} the id of the parent row
         * @param isExpanded {Boolean} the state for which the icon should be set
         */
        changeChildrenToggleIcon: function(recordId, isExpanded) {
            var $icon = this.sandbox.dom.find('.' + constants.toggleIconClass, this.table.rows[recordId].$el);
            if (!!$icon && !!$icon.length) {
                if (isExpanded === true) {
                    this.sandbox.dom.removeClass($icon, constants.collapsedIcon);
                    this.sandbox.dom.prependClass($icon, constants.expandedIcon);
                } else {
                    this.sandbox.dom.removeClass($icon, constants.expandedIcon);
                    this.sandbox.dom.prependClass($icon, constants.collapsedIcon);
                }
            }
        },

        /**
         * Toggles the children of a parent
         * @param recordId {Number|String} the id of the parent to toggle the children for
         */
        toggleChildren: function(recordId) {
            if (this.table.rows[recordId].childrenLoaded === true) {
                if (this.table.rows[recordId].childrenExpanded === true) {
                    this.hideChildren(recordId);
                    this.sandbox.emit(CHILDREN_COLLAPSED.call(this));
                } else {
                    this.showChildren(recordId);
                    this.sandbox.emit(CHILDREN_EXPANDED.call(this));
                }
            } else {
                this.loadChildren(recordId);
            }
        },

        /**
         * Hides the children of a parent
         * @param recordId {Number|String} the id of the parent to hide the children for
         */
        hideChildren: function(recordId) {
            this.sandbox.util.each(this.table.rows, function(rowId, row) {
                if (row.parent == recordId) {
                    if (!!row.hasChildren) {
                        this.hideChildren(rowId);
                    }
                    this.sandbox.dom.hide(row.$el);
                }
            }.bind(this));
            this.table.rows[recordId].childrenExpanded = false;
            this.changeChildrenToggleIcon(recordId, false);
        },

        /**
         * Shows the children of a parent
         * @param recordId {Number|String} the id of the parent to show the children for
         */
        showChildren: function(recordId) {
            this.sandbox.util.each(this.table.rows, function(rowId, row) {
                if (row.parent == recordId) {
                    this.sandbox.dom.show(row.$el);
                }
            }.bind(this));
            this.table.rows[recordId].childrenExpanded = true;
            this.changeChildrenToggleIcon(recordId, true);
        },

        /**
         * Loads the children of a parent and displays them
         * @param recordId {Number|String} the id of the parent to load the children for
         */
        loadChildren: function(recordId) {
            this.datagrid.loadChildren.call(this.datagrid, recordId);
            this.table.rows[recordId].childrenLoaded = true;
        },

        /**
         * Opens all parents of a record
         * @param id {Number|String} the id of the record
         */
        openParents: function(recordId) {
            if (!!this.table && !!this.table.rows[recordId]) {
                var parentId = this.table.rows[recordId].parent;
                if (!!parentId) {
                    if (!!this.table.rows[parentId].parent) {
                        this.openParents(parentId);
                    }
                    this.showChildren(parentId);
                }
            }
        }
     };
});
